import { NodePath } from "@babel/traverse";
import { AstCodes, ComponentOptionArray } from "src/types";
/**
 * 将全局组件以 import xx from "xx" 的形式注入页面
 * @param {AstCodes} ast
 * @param {ComponentOptionArray} comConfigs
 */
export declare const injectImportComponents: (ast: AstCodes, comConfigs: ComponentOptionArray) => void;
/**
 * 将代码块注入文件 --- function|class|字面量时处理，其余递归至符合要求
 * @description 我们将遍历该页面直至最后获取导出的 ArrowFunctionExpression | FunctionDeclaration | FunctionExpression | ClassDeclaration | ClassExpression 类型做插入
 * @param {*} pathNode 导出 AST Path 实例对象,在babel中为 NodePath 对象，包含了具体信息
 * @param {*} comConfigs
 */
export declare const injectComponentTag: (pathNode: NodePath<any>, comConfigs: ComponentOptionArray, filePath: string) => void;
/**
 * 插入一个 import { View } from '@tarojs/components' 语句
 * @param {AstCodes} ast
 */
export declare const injectImportTaroBlockComponent: (ast: AstCodes) => void;
