"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeASTObjects = exports.generateAST = exports.getBindingNode = exports.wrapJSXClosingElement = exports.getDefaultExportNode = exports.createReactCallExpression = exports.createJSXElement = exports.ast2code = exports.code2ast = void 0;
// AST 辅助函数集
const generator_1 = require("@babel/generator");
const parser_1 = require("@babel/parser");
const traverse_1 = require("@babel/traverse");
const types_1 = require("@babel/types");
const code2ast = (source) => {
    return parser_1.default.parse(source, {
        sourceType: "module",
        ranges: true,
        plugins: ["jsx", "typescript", "classProperties"],
    });
};
exports.code2ast = code2ast;
const ast2code = (ast) => {
    return (0, generator_1.default)(ast).code;
};
exports.ast2code = ast2code;
/**
 * 创建 jSXElement nodePath
 * https://babeljs.io/docs/babel-types#jsxelement
 * @param {*} name
 * @return {*}
 */
const createJSXElement = (name) => {
    return types_1.default.jSXElement(types_1.default.jSXOpeningElement(types_1.default.jsxIdentifier("" + name), [], true), null, [], true);
};
exports.createJSXElement = createJSXElement;
/**
 * 创建 React.createElement nodePath
 * https://babeljs.io/docs/babel-types#identifier
 * @param {*} name
 * @return {*}
 */
const createReactCallExpression = (name) => {
    // 创建React、createElement两个函数node
    const reactIdentifier = types_1.default.identifier("React");
    const createElementIdentifier = types_1.default.identifier("createElement");
    // 为React函数prototype增加createElement
    const callee = types_1.default.memberExpression(reactIdentifier, createElementIdentifier);
    // 将我们要创建的组件当参传入成return <name />函数
    return types_1.default.callExpression(callee, [types_1.default.identifier(name)]);
};
exports.createReactCallExpression = createReactCallExpression;
/**
 * 获取默认导出块
 * @description 默认页面组件到处时应采用 export default XX 的形式导出
 * @param {*} ast
 */
const getDefaultExportNode = (ast) => {
    let _node;
    (0, traverse_1.default)(ast, {
        ExportDefaultDeclaration(node) {
            _node = node;
            node.stop();
        },
    });
    return _node;
};
exports.getDefaultExportNode = getDefaultExportNode;
/**
 * 为组件包裹一个View标签: <Content /> => <View><Content /></View>
 * @param {*} node
 * @returns {*} 此时返回的根节点为<View></View>
 */
const wrapJSXClosingElement = (pathNode) => {
    const fragments = types_1.default.jsxElement(types_1.default.jsxOpeningElement(types_1.default.jsxIdentifier("View"), []), types_1.default.jsxClosingElement(types_1.default.jsxIdentifier("View")), [pathNode.node]);
    pathNode.replaceWith(fragments);
};
exports.wrapJSXClosingElement = wrapJSXClosingElement;
/**
 * 获取页面节点相关的详细绑定信息（通过绑定的路径获取-binding.path）
 * 用于获取指定变量名所对应的内容实例，如传入 name1 索引获取 const name1 = () => {} path实例
 * @param {*} node
 * @param {*} name 变量名
 * @returns {*}
 */
const getBindingNode = (pathNode, name) => {
    try {
        const _path = pathNode.scope.bindings[name].path;
        return _path;
    }
    catch (error) {
        return void 0;
    }
};
exports.getBindingNode = getBindingNode;
/**
 * 遍历生成AST对象|数组
 * @param {*} obj
 * @returns
 */
const generateAST = (obj) => {
    if (Array.isArray(obj)) {
        // 如果是数组类型，则递归处理每个元素
        const elements = obj.map(exports.generateAST);
        return types_1.default.arrayExpression(elements);
    }
    else if (typeof obj === "object" && obj !== null) {
        // 如果是对象类型，则递归处理每个属性
        const properties = Object.entries(obj).map(([key, value]) => {
            const keyNode = types_1.default.isValidIdentifier(key)
                ? types_1.default.identifier(key)
                : types_1.default.stringLiteral(key);
            const valueNode = (0, exports.generateAST)(value);
            return types_1.default.objectProperty(keyNode, valueNode);
        });
        return types_1.default.objectExpression(properties);
    }
    else if (typeof obj === "string") {
        // 如果是字符串类型，则创建字符串字面量节点
        return types_1.default.stringLiteral(obj);
    }
    else if (typeof obj === "number") {
        // 如果是数字类型，则创建数字字面量节点
        return types_1.default.numericLiteral(obj);
    }
    else if (typeof obj === "boolean") {
        // 如果是布尔类型，则创建布尔字面量节点
        return types_1.default.booleanLiteral(obj);
    }
    else if (obj === null) {
        // 如果是 null，则创建 null 字面量节点
        return types_1.default.nullLiteral();
    }
    else if (obj === undefined) {
        // 如果是 undefined，则创建 undefined 字面量节点
        return types_1.default.identifier("undefined");
    }
    else {
        throw new Error(`Unsupported object type: ${typeof obj}`);
    }
};
exports.generateAST = generateAST;
/**
 * 遍历合成两个AST Object对象
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
const mergeASTObjects = (obj1, obj2) => {
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
                    existingProp.value = (0, exports.mergeASTObjects)(existingProp.value, prop.value);
                }
                else {
                    // 否则添加属性
                    mergedProperties.set(propName, prop);
                }
            }
        }
        // 将 mergedProperties 转换为属性数组
        const mergedPropsArray = Array.from(mergedProperties.values());
        // 返回合并后的对象
        return types_1.default.objectExpression(mergedPropsArray);
    }
    else {
        // 如果不是对象类型，则返回 obj2
        return obj2;
    }
};
exports.mergeASTObjects = mergeASTObjects;
//# sourceMappingURL=ast-helper.js.map