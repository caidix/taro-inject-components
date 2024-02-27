import { ComponentOptionArray, AstCodes } from "../types";
export declare const getGlobalComponents: (componentFilePath: string, pagePath: string) => ComponentOptionArray;
/**
 * 过滤已经被引入的全局组件
 * @param {*} comConfigs
 * @param {*} ast
 * @param {*} alias
 */
export declare const filterInjectedComponents: (ast: AstCodes, filePath: string, comConfigs: ComponentOptionArray, aliasMaping: [string, string][]) => ComponentOptionArray;
