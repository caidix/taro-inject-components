import { NodePath } from "@babel/traverse";
import t from "@babel/types";
import { AstCodes } from "../types";
export declare const code2ast: (source: string) => AstCodes;
export declare const ast2code: (ast: AstCodes) => string;
/**
 * 创建 jSXElement nodePath
 * https://babeljs.io/docs/babel-types#jsxelement
 * @param {*} name
 * @return {*}
 */
export declare const createJSXElement: (name: any) => t.JSXElement;
/**
 * 创建 React.createElement nodePath
 * https://babeljs.io/docs/babel-types#identifier
 * @param {*} name
 * @return {*}
 */
export declare const createReactCallExpression: (name: any) => t.CallExpression;
declare type ExportNode = NodePath<t.ExportDefaultDeclaration> | undefined;
/**
 * 获取默认导出块
 * @description 默认页面组件到处时应采用 export default XX 的形式导出
 * @param {*} ast
 */
export declare const getDefaultExportNode: (ast: AstCodes) => ExportNode;
/**
 * 为组件包裹一个View标签: <Content /> => <View><Content /></View>
 * @param {*} node
 * @returns {*} 此时返回的根节点为<View></View>
 */
export declare const wrapJSXClosingElement: (pathNode: any) => void;
/**
 * 获取页面节点相关的详细绑定信息（通过绑定的路径获取-binding.path）
 * 用于获取指定变量名所对应的内容实例，如传入 name1 索引获取 const name1 = () => {} path实例
 * @param {*} node
 * @param {*} name 变量名
 * @returns {*}
 */
export declare const getBindingNode: (pathNode: any, name: any) => any;
/**
 * 遍历生成AST对象|数组
 * @param {*} obj
 * @returns
 */
export declare const generateAST: (obj: any) => any;
/**
 * 遍历合成两个AST Object对象
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
export declare const mergeASTObjects: (obj1: any, obj2: any) => any;
export {};
