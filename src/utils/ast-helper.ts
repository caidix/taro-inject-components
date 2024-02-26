// AST 辅助函数集
import generate from "@babel/generator";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import { NodePath } from "@babel/traverse";
import t from "@babel/types";
import { AstCodes } from "../types";

export const code2ast = (source: string): AstCodes => {
  return parser.parse(source, {
    sourceType: "module",
    ranges: true,
    plugins: ["jsx", "typescript", "classProperties"],
  });
};

export const ast2code = (ast: AstCodes): string => {
  return generate(ast).code;
};

/**
 * 创建 jSXElement nodePath
 * https://babeljs.io/docs/babel-types#jsxelement
 * @param {*} name
 * @return {*}
 */
export const createJSXElement = (name) => {
  return t.jSXElement(
    t.jSXOpeningElement(t.jsxIdentifier("" + name), [], true),
    null,
    [],
    true
  );
};

/**
 * 创建 React.createElement nodePath
 * https://babeljs.io/docs/babel-types#identifier
 * @param {*} name
 * @return {*}
 */
export const createReactCallExpression = (name) => {
  // 创建React、createElement两个函数node
  const reactIdentifier = t.identifier("React");
  const createElementIdentifier = t.identifier("createElement");
  // 为React函数prototype增加createElement
  const callee = t.memberExpression(reactIdentifier, createElementIdentifier);
  // 将我们要创建的组件当参传入成return <name />函数
  return t.callExpression(callee, [t.identifier(name)]);
};

type ExportNode = NodePath<t.ExportDefaultDeclaration> | undefined;
/**
 * 获取默认导出块
 * @description 默认页面组件到处时应采用 export default XX 的形式导出
 * @param {*} ast
 */
export const getDefaultExportNode = (ast: AstCodes): ExportNode => {
  let _node: ExportNode;
  traverse(ast, {
    ExportDefaultDeclaration(node) {
      _node = node;
      node.stop();
    },
  });
  return _node;
};
/**
 * 为组件包裹一个View标签: <Content /> => <View><Content /></View>
 * @param {*} node
 * @returns {*} 此时返回的根节点为<View></View>
 */
export const wrapJSXClosingElement = (pathNode) => {
  const fragments = t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier("View"), []),
    t.jsxClosingElement(t.jsxIdentifier("View")),
    [pathNode.node]
  );
  pathNode.replaceWith(fragments);
};

/**
 * 获取页面节点相关的详细绑定信息（通过绑定的路径获取-binding.path）
 * 用于获取指定变量名所对应的内容实例，如传入 name1 索引获取 const name1 = () => {} path实例
 * @param {*} node
 * @param {*} name 变量名
 * @returns {*}
 */
export const getBindingNode = (pathNode, name) => {
  try {
    const _path = pathNode.scope.bindings[name].path;
    return _path;
  } catch (error) {
    return void 0;
  }
};

/**
 * 遍历生成AST对象|数组
 * @param {*} obj
 * @returns
 */
export const generateAST = (obj) => {
  if (Array.isArray(obj)) {
    // 如果是数组类型，则递归处理每个元素
    const elements = obj.map(generateAST);
    return t.arrayExpression(elements);
  } else if (typeof obj === "object" && obj !== null) {
    // 如果是对象类型，则递归处理每个属性
    const properties = Object.entries(obj).map(([key, value]) => {
      const keyNode = t.isValidIdentifier(key)
        ? t.identifier(key)
        : t.stringLiteral(key);
      const valueNode = generateAST(value);
      return t.objectProperty(keyNode, valueNode);
    });
    return t.objectExpression(properties);
  } else if (typeof obj === "string") {
    // 如果是字符串类型，则创建字符串字面量节点
    return t.stringLiteral(obj);
  } else if (typeof obj === "number") {
    // 如果是数字类型，则创建数字字面量节点
    return t.numericLiteral(obj);
  } else if (typeof obj === "boolean") {
    // 如果是布尔类型，则创建布尔字面量节点
    return t.booleanLiteral(obj);
  } else if (obj === null) {
    // 如果是 null，则创建 null 字面量节点
    return t.nullLiteral();
  } else if (obj === undefined) {
    // 如果是 undefined，则创建 undefined 字面量节点
    return t.identifier("undefined");
  } else {
    throw new Error(`Unsupported object type: ${typeof obj}`);
  }
};

/**
 * 遍历合成两个AST Object对象
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
export const mergeASTObjects = (obj1, obj2) => {
  if (obj1.type === "ObjectExpression" && obj2.type === "ObjectExpression") {
    const mergedProperties = new Map();

    // 将 obj1 的属性添加到 mergedProperties
    for (const prop of obj1.properties) {
      if (prop.type === "ObjectProperty") {
        mergedProperties.set(prop.key.name, prop);
      }
    }
    // 将 obj2 的属性合并或添加到 mergedProperties
    for (const prop of obj2.properties) {
      if (prop.type === "ObjectProperty") {
        const propName = prop.key.name;
        if (mergedProperties.has(propName)) {
          // 如果属性已存在，则合并值
          const existingProp = mergedProperties.get(propName);
          existingProp.value = mergeASTObjects(existingProp.value, prop.value);
        } else {
          // 否则添加属性
          mergedProperties.set(propName, prop);
        }
      }
    }
    // 将 mergedProperties 转换为属性数组
    const mergedPropsArray = Array.from(mergedProperties.values());

    // 返回合并后的对象
    return t.objectExpression(mergedPropsArray);
  } else {
    // 如果不是对象类型，则返回 obj2
    return obj2;
  }
};
