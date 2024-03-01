"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectImportTaroBlockComponent = exports.injectComponentTag = exports.injectImportComponents = void 0;
// @ts-nocheck
/**
 * AST实现注入流程集
 */
const path = require("path");
const traverse_1 = require("@babel/traverse");
const template_1 = require("@babel/template");
const types_1 = require("@babel/types");
const helper_1 = require("@tarojs/helper");
const ast_helper_1 = require("../utils/ast-helper");
const consts_1 = require("../utils/consts");
/**
 * 将全局组件以 import xx from "xx" 的形式注入页面
 * @param {AstCodes} ast
 * @param {ComponentOptionArray} comConfigs
 */
const injectImportComponents = (ast, comConfigs) => {
    for (const com of comConfigs) {
        try {
            const entry = com.entry.split(path.sep).join("/");
            const astCom = template_1.default.ast(`import ${com.tagName} from '${entry}';`);
            ast.program.body.unshift(astCom);
            // printLog(processTypeEnum.CREATE, `注入 ${com.tagName} 组件成功`);
        }
        catch (error) {
            (0, helper_1.printLog)("error" /* processTypeEnum.ERROR */, `注入 ${com.tagName} 组件失败: ${error}`);
        }
    }
};
exports.injectImportComponents = injectImportComponents;
/**
 * 注入JSX元素
 * @param {*} pathNode argument为 JSXElement 类型的 ReturnStatement 实例
 * @param {*} comConfigs
 * @returns
 */
const injectJSXElement = (pathNode, comConfigs) => {
    var _a, _b, _c;
    if (!types_1.default.isJSXElement(pathNode) && !types_1.default.isJSXFragment(pathNode))
        return;
    if (consts_1.UNINJECT_TAGS[((_c = (_b = (_a = pathNode.node) === null || _a === void 0 ? void 0 : _a.openingElement) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.name) || ""])
        return;
    (0, ast_helper_1.wrapJSXClosingElement)(pathNode);
    for (const com of comConfigs) {
        if (com.injectPosition === "top") {
            pathNode.node.children.unshift((0, ast_helper_1.createJSXElement)(com.tagName));
        }
        else {
            pathNode.node.children.push((0, ast_helper_1.createJSXElement)(com.tagName));
        }
    }
};
const injectCallExpression = (pathNode, comConfigs, filePath) => {
    var _a, _b, _c;
    // CreateElement只有最后的...children接收额外传入ReactNode，故默认只采用push形式
    if (((_c = (_b = (_a = pathNode.node) === null || _a === void 0 ? void 0 : _a.callee) === null || _b === void 0 ? void 0 : _b.property) === null || _c === void 0 ? void 0 : _c.name) === "createElement") {
        const _arguments = pathNode.node.arguments;
        for (const com of comConfigs) {
            _arguments.push((0, ast_helper_1.createReactCallExpression)(com.tagName));
        }
        return;
    }
    const pathBody = pathNode.get("callee").get("body");
    if (pathBody.isBlockStatement()) {
        handleReturnStatement(pathBody, comConfigs, filePath);
    }
    else {
        injectJSXElement(pathBody, comConfigs);
    }
};
const handleInjectArgumentFromType = (argumentPaths, comConfigs, filePath, done) => {
    if (!argumentPaths) {
        return;
    }
    // return <xxx></xxx> 已认证
    if (types_1.default.isJSXElement(argumentPaths) || types_1.default.isJSXFragment(argumentPaths)) {
        injectJSXElement(argumentPaths, comConfigs);
        done && done();
        return;
    }
    // return a > 0 ? <XX/> : null; 已认证
    if (types_1.default.isConditionalExpression(argumentPaths)) {
        const consequent = argumentPaths.get("consequent");
        const alternate = argumentPaths.get("alternate");
        handleInjectArgumentFromType(consequent, comConfigs, filePath, done);
        handleInjectArgumentFromType(alternate, comConfigs, filePath, done);
        return;
    }
    // return React?.createElement -- 不接受 createElement, 兼容特殊函数场景
    if (types_1.default.isCallExpression(argumentPaths)) {
        injectCallExpression(argumentPaths, comConfigs, filePath);
        done && done();
        return;
    }
    // return { ComponentXX }
    if (types_1.default.isObjectExpression(argumentPaths)) {
        injectJSXElement(argumentPaths, comConfigs);
        done && done();
        return;
    }
    // return aa && ComponentXX || ComponentYY
    if (types_1.default.isLogicalExpression(argumentPaths)) {
        const left = argumentPaths.get("left");
        const right = argumentPaths.get("right");
        handleInjectArgumentFromType(left, comConfigs, filePath, done);
        handleInjectArgumentFromType(right, comConfigs, filePath, done);
        return;
    }
    if (types_1.default.isTSAsExpression(argumentPaths)) {
        handleTSAsExpression(argumentPaths, comConfigs, filePath);
        return;
    }
    if (types_1.default.isIdentifier(argumentPaths)) {
        handleIdentifier(argumentPaths, comConfigs, filePath);
        return;
    }
    if (types_1.default.isVariableDeclarator(argumentPaths)) {
        handleVariableDeclarator(argumentPaths, comConfigs, filePath);
    }
};
/**
 * 处理返回体代码中的 return 逻辑
 * @param {*} pathNode  XXFunction.body
 * @param {*} comConfigs
 * @returns {*}
 */
const handleReturnStatement = (pathNode, comConfigs, filePath) => {
    try {
        let canInject = false;
        const u = pathNode.get("body");
        const bodyList = u.get("body");
        bodyList.forEach((_node) => {
            if (types_1.default.isReturnStatement(_node) && !canInject) {
                // 注入 -- 只针对函数最外层的 return 做处理
                canInject = true;
                _node.node.__GLOBAL__COMPONENT__ = "__GLOBAL__COMPONENT__";
                const argumentPaths = _node.get("argument");
                handleInjectArgumentFromType(argumentPaths, comConfigs, filePath, () => {
                    _node.skip();
                });
            }
            // @ts-ignore
            if (types_1.default.isIfStatement(_node)) {
                handleReturnStatement(_node, comConfigs, filePath);
                return;
            }
        });
    }
    catch (error) { }
};
/**
 * 处理ts断言类型 (xx) as any => (<>xx<myComponent/></>) as any
 * @returns
 */
const handleTSAsExpression = (pathNode, comConfigs, filePath) => {
    var _a, _b;
    if ((_b = (_a = pathNode.node) === null || _a === void 0 ? void 0 : _a.expression) === null || _b === void 0 ? void 0 : _b.name) {
        return (0, exports.injectComponentTag)((0, ast_helper_1.getBindingNode)(pathNode, pathNode.node.expression.name), comConfigs, filePath);
    }
    return handleInjectArgumentFromType(pathNode.get("expression"), comConfigs, filePath);
};
/**
 * 处理 Class 类型中的render返回体， 默认 render() { return } 形式
 */
const handleClass = (pathNode, compConfigs, filePath) => {
    (0, traverse_1.default)(pathNode.node, {
        ClassMethod(_node) {
            var _a;
            if (((_a = _node.node.key) === null || _a === void 0 ? void 0 : _a.name) !== "render")
                return;
            handleReturnStatement(_node, compConfigs, filePath);
            _node.stop();
        },
    }, pathNode.scope, pathNode);
};
const handleIdentifier = (pathNode, comConfigs, filePath) => {
    // 获取 export default XX 中的 XX
    const exportComName = pathNode.node.name;
    return (0, exports.injectComponentTag)((0, ast_helper_1.getBindingNode)(pathNode, exportComName), comConfigs, filePath);
};
/**
 * 处理 export default 为箭头函数时的 return；
 */
const handleArrowFunctionExpression = (functionNode, comConfigs, filePath) => {
    const functionBody = functionNode.get("body");
    // () => xx  OR () => { return xx } OR () => React.CreateElement
    if (types_1.default.isBlockStatement(functionBody.node)) {
        handleReturnStatement(functionNode, comConfigs, filePath);
        return;
    }
    if (types_1.default.isCallExpression(functionBody.node)) {
        (0, exports.injectComponentTag)(functionNode, comConfigs, filePath);
        return;
    }
    injectJSXElement(functionBody, comConfigs);
};
/**
 * 处理字面量类型
 * 作为页面组件，其VariableDeclarator对应类型下的init值应为ArrowFunctionExpression类型
 */
const handleVariableDeclarator = (pathNode, comConfigs, filePath) => {
    const valuePathNode = pathNode.get("init");
    return (0, exports.injectComponentTag)(valuePathNode, comConfigs, filePath);
};
/**
 * 将代码块注入文件 --- function|class|字面量时处理，其余递归至符合要求
 * @description 我们将遍历该页面直至最后获取导出的 ArrowFunctionExpression | FunctionDeclaration | FunctionExpression | ClassDeclaration | ClassExpression 类型做插入
 * @param {*} pathNode 导出 AST Path 实例对象,在babel中为 NodePath 对象，包含了具体信息
 * @param {*} comConfigs
 */
const injectComponentTag = (pathNode, comConfigs, filePath) => {
    if (!pathNode || !pathNode.node)
        return;
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
exports.injectComponentTag = injectComponentTag;
/**
 * 插入一个 import { View } from '@tarojs/components' 语句
 * @param {AstCodes} ast
 */
const injectImportTaroBlockComponent = (ast) => {
    let taroComponentsImported = false;
    (0, traverse_1.default)(ast, {
        ImportDeclaration: (__path) => {
            var _a;
            if (__path.node.source.value !== "@tarojs/components")
                return;
            taroComponentsImported = true;
            let blockComponentImported = (_a = __path.node.specifiers) === null || _a === void 0 ? void 0 : _a.find((node) => node.local.name === "View");
            if (blockComponentImported) {
                __path.stop();
                return;
            }
            const specifierNames = __path.node.specifiers.map((sp) => sp.local.name);
            specifierNames.push("View");
            const importAst = template_1.default.ast(`import {${specifierNames.join(",")}} from '@tarojs/components'`);
            __path.replaceWith(importAst);
            __path.stop();
        },
    });
    if (taroComponentsImported)
        return;
    const importAst = template_1.default.ast(`import { View } from '@tarojs/components'`);
    ast.program.body.unshift(importAst);
};
exports.injectImportTaroBlockComponent = injectImportTaroBlockComponent;
//# sourceMappingURL=ast-inject-handler.js.map