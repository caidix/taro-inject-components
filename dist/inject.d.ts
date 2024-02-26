import { InjectOptions } from "./types";
/**
 * 自动注入全局组件
 * @param {string} source 页面字符串源码
 * @param {object} options 用户传入全局配置项
 * @param {string} filePath 当前页面路径参数
 * @param {string} pagePath 小程序路由路径参数
 * @param {object} webpackAlias Webpack alias代理设置
 */
declare function handleInjectComponents(source: string, options: InjectOptions, filePath: string, pagePath: string, webpackAlias: Record<string, string>): any;
export default handleInjectComponents;
