// @ts-nocheck
/**
 * AST实现注入流程集
 */
import * as path from "path";
import traverse, { NodePath } from "@babel/traverse";
import template from "@babel/template";
import t from "@babel/types";
import { processTypeEnum, printLog } from "@tarojs/helper";
import {
  wrapJSXClosingElement,
  createJSXElement,
  createReactCallExpression,
  getBindingNode,
} from "../utils/ast-helper";
import { UNINJECT_TAGS } from "../utils/consts";
import { AstCodes, ComponentOptionArray } from "src/types";

/**
 * 将全局组件以 import xx from "xx" 的形式注入页面
 * @param {AstCodes} ast
 * @param {ComponentOptionArray} comConfigs
 */
export const injectImportComponents = (
  ast: AstCodes,
  comConfigs: ComponentOptionArray
) => {
  for (const com of comConfigs) {
    try {
      const entry = com.entry.split(path.sep).join("/");
      const astCom = template.ast(`import ${com.tagName} from '${entry}';`);
      ast.program.body.unshift(astCom);
      // printLog(processTypeEnum.CREATE, `注入 ${com.tagName} 组件成功`);
    } catch (error) {
      printLog(processTypeEnum.ERROR, `注入 ${com.tagName} 组件失败: ${error}`);
    }
  }
};

/**
 * 注入JSX元素
 * @param {*} pathNode argument为 JSXElement 类型的 ReturnStatement 实例
 * @param {*} comConfigs
 * @returns
 */
const injectJSXElement = (pathNode, comConfigs) => {
  if (!t.isJSXElement(pathNode) && !t.isJSXFragment(pathNode)) return;
  if (UNINJECT_TAGS[pathNode.node?.openingElement?.name?.name || ""]) return;

  wrapJSXClosingElement(pathNode);

  for (const com of comConfigs) {
    if (com.injectPosition === "top") {
      pathNode.node.children.unshift(createJSXElement(com.tagName));
    } else {
      pathNode.node.children.push(createJSXElement(com.tagName));
    }
  }
};

const injectCallExpression = (pathNode, comConfigs, filePath) => {
  // CreateElement只有最后的...children接收额外传入ReactNode，故默认只采用push形式
  if (pathNode.node?.callee?.property?.name === "createElement") {
    const _arguments = pathNode.node.arguments;
    for (const com of comConfigs) {
      _arguments.push(createReactCallExpression(com.tagName));
    }
    return;
  }
  const pathBody = pathNode.get("callee").get("body");
  if (pathBody.isBlockStatement()) {
    handleReturnStatement(pathBody, comConfigs, filePath);
  } else {
    injectJSXElement(pathBody, comConfigs);
  }
};

const handleInjectArgumentFromType = (
  argumentPaths,
  comConfigs: ComponentOptionArray,
  filePath: string,
  done?: () => void
) => {
  if (!argumentPaths) {
    return;
  }
  // return <xxx></xxx> 已认证
  if (t.isJSXElement(argumentPaths) || t.isJSXFragment(argumentPaths)) {
    injectJSXElement(argumentPaths, comConfigs);
    done && done();
    return;
  }

  // return a > 0 ? <XX/> : null; 已认证
  if (t.isConditionalExpression(argumentPaths)) {
    const consequent = argumentPaths.get("consequent");
    const alternate = argumentPaths.get("alternate");
    handleInjectArgumentFromType(consequent, comConfigs, filePath, done);
    handleInjectArgumentFromType(alternate, comConfigs, filePath, done);
    return;
  }

  // return React?.createElement -- 不接受 createElement, 兼容特殊函数场景
  if (t.isCallExpression(argumentPaths)) {
    injectCallExpression(argumentPaths, comConfigs, filePath);
    done && done();
    return;
  }

  // return { ComponentXX }
  if (t.isObjectExpression(argumentPaths)) {
    injectJSXElement(argumentPaths, comConfigs);
    done && done();
    return;
  }

  // return aa && ComponentXX || ComponentYY
  if (t.isLogicalExpression(argumentPaths)) {
    const left = argumentPaths.get("left");
    const right = argumentPaths.get("right");
    handleInjectArgumentFromType(left, comConfigs, filePath, done);
    handleInjectArgumentFromType(right, comConfigs, filePath, done);
    return;
  }

  if (t.isTSAsExpression(argumentPaths)) {
    handleTSAsExpression(argumentPaths, comConfigs, filePath);
    return;
  }

  if (t.isIdentifier(argumentPaths)) {
    handleIdentifier(argumentPaths, comConfigs, filePath);
    return;
  }

  if (t.isVariableDeclarator(argumentPaths)) {
    handleVariableDeclarator(argumentPaths, comConfigs, filePath);
  }
};

/**
 * 处理返回体代码中的 return 逻辑
 * @param {*} pathNode  XXFunction.body
 * @param {*} comConfigs
 * @returns {*}
 */
const handleReturnStatement = (
  pathNode: NodePath<any>,
  comConfigs: ComponentOptionArray,
  filePath: string
) => {
  try {
    let canInject = false;
    const u = pathNode.get("body") as NodePath<t.BlockStatement>;
    const bodyList = u.get("body");
    bodyList.forEach((_node) => {
      if (t.isReturnStatement(_node) && !canInject) {
        // 注入 -- 只针对函数最外层的 return 做处理
        canInject = true;

        _node.node.__GLOBAL__COMPONENT__ = "__GLOBAL__COMPONENT__";
        const argumentPaths = _node.get("argument");
        handleInjectArgumentFromType(
          argumentPaths,
          comConfigs,
          filePath,
          () => {
            _node.skip();
          }
        );
      }
      // @ts-ignore
      if (t.isIfStatement(_node)) {
        handleReturnStatement(_node, comConfigs, filePath);
        return;
      }
    });
  } catch (error) {}
};

/**
 * 处理ts断言类型 (xx) as any => (<>xx<myComponent/></>) as any
 * @returns
 */
const handleTSAsExpression = (pathNode, comConfigs, filePath) => {
  if (pathNode.node?.expression?.name) {
    return injectComponentTag(
      getBindingNode(pathNode, pathNode.node.expression.name),
      comConfigs,
      filePath
    );
  }
  return handleInjectArgumentFromType(
    pathNode.get("expression"),
    comConfigs,
    filePath
  );
};

/**
 * 处理 Class 类型中的render返回体， 默认 render() { return } 形式
 */
const handleClass = (pathNode, compConfigs, filePath) => {
  traverse(
    pathNode.node,
    {
      ClassMethod(_node) {
        if (_node.node.key?.name !== "render") return;
        handleReturnStatement(_node, compConfigs, filePath);
        _node.stop();
      },
    },
    pathNode.scope,
    pathNode
  );
};

const handleIdentifier = (
  pathNode: NodePath<t.Identifier>,
  comConfigs: ComponentOptionArray,
  filePath: string
) => {
  // 获取 export default XX 中的 XX
  const exportComName = pathNode.node.name;
  return injectComponentTag(
    getBindingNode(pathNode, exportComName),
    comConfigs,
    filePath
  );
};

/**
 * 处理 export default 为箭头函数时的 return；
 */
const handleArrowFunctionExpression = (
  functionNode: NodePath<t.ArrowFunctionExpression>,
  comConfigs: ComponentOptionArray,
  filePath: string
) => {
  const functionBody = functionNode.get("body");
  // () => xx  OR () => { return xx } OR () => React.CreateElement
  if (t.isBlockStatement(functionBody.node)) {
    handleReturnStatement(functionNode, comConfigs, filePath);
    return;
  }
  if (t.isCallExpression(functionBody.node)) {
    injectComponentTag(functionNode, comConfigs, filePath);
    return;
  }
  injectJSXElement(functionBody, comConfigs);
};

/**
 * 处理字面量类型
 * 作为页面组件，其VariableDeclarator对应类型下的init值应为ArrowFunctionExpression类型
 */
const handleVariableDeclarator = (
  pathNode: NodePath<t.VariableDeclarator>,
  comConfigs: ComponentOptionArray,
  filePath: string
) => {
  const valuePathNode = pathNode.get("init");
  return injectComponentTag(valuePathNode, comConfigs, filePath);
};

/**
 * 将代码块注入文件 --- function|class|字面量时处理，其余递归至符合要求
 * @description 我们将遍历该页面直至最后获取导出的 ArrowFunctionExpression | FunctionDeclaration | FunctionExpression | ClassDeclaration | ClassExpression 类型做插入
 * @param {*} pathNode 导出 AST Path 实例对象,在babel中为 NodePath 对象，包含了具体信息
 * @param {*} comConfigs
 */
export const injectComponentTag = (
  pathNode: NodePath<any>,
  comConfigs: ComponentOptionArray,
  filePath: string
) => {
  if (!pathNode || !pathNode.node) return;
  switch (pathNode.node.type) {
    case "Identifier": // 处理字面量|变量
      handleIdentifier(pathNode, comConfigs, filePath);
      break;
    case "VariableDeclarator": // 处理字面量函数
      handleVariableDeclarator(pathNode, comConfigs, filePath);
      break;
    case "ArrowFunctionExpression": // 处理箭头函数
      handleArrowFunctionExpression(pathNode, comConfigs, filePath);
      break;
    case "FunctionDeclaration": // 处理函数 function xx() { return }
    case "FunctionExpression": // 处理匿名函数 const xx = function() { return }
      handleReturnStatement(pathNode, comConfigs, filePath);
      break;
    case "TSAsExpression": // 处理Ts断言 const i = Component as string;
      handleTSAsExpression(pathNode, comConfigs, filePath);
      break;
    case "ClassDeclaration":
    case "ClassExpression":
      handleClass(pathNode, comConfigs, filePath);
    case "CallExpression":
      injectCallExpression(pathNode, comConfigs, filePath);
      break;
    case "JSXElement": // 特殊情况 - () => {const I = <></>; return I } 时触发
      injectJSXElement(pathNode, comConfigs);
      break;
    default:
      break;
  }
};

/**
 * 插入一个 import { View } from '@tarojs/components' 语句
 * @param {AstCodes} ast
 */
export const injectImportTaroBlockComponent = (ast: AstCodes) => {
  let taroComponentsImported = false;
  traverse(ast, {
    ImportDeclaration: (__path) => {
      if (__path.node.source.value !== "@tarojs/components") return;

      taroComponentsImported = true;
      let blockComponentImported = __path.node.specifiers?.find(
        (node) => node.local.name === "View"
      );
      if (blockComponentImported) {
        __path.stop();
        return;
      }

      const specifierNames = __path.node.specifiers.map((sp) => sp.local.name);
      specifierNames.push("View");
      const importAst = template.ast(
        `import {${specifierNames.join(",")}} from '@tarojs/components'`
      );
      __path.replaceWith(importAst);
      __path.stop();
    },
  });

  if (taroComponentsImported) return;

  const importAst = template.ast(`import { View } from '@tarojs/components'`);
  ast.program.body.unshift(importAst);
};
