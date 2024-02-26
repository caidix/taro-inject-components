"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("@tarojs/helper");
const utils_1 = require("./utils");
const ast_helper_1 = require("./utils/ast-helper");
const components_handler_1 = require("./commons/components-handler");
const ast_inject_handler_1 = require("./commons/ast-inject-handler");
// 全局组件配置缓存 - 运行过程中理论上只需要获取一次全局配置
let globalComponentConfigs;
// 页面缓存， 多次执行插件内容容易爆栈
const cachedPageCode = new Map();
/**
 * 自动注入全局组件
 * @param {string} source 页面字符串源码
 * @param {object} options 用户传入全局配置项
 * @param {string} filePath 当前页面路径参数
 * @param {string} pagePath 小程序路由路径参数
 * @param {object} webpackAlias Webpack alias代理设置
 */
function handleInjectComponents(source, options, filePath, pagePath, webpackAlias) {
    if (!options.enable) {
        return source;
    }
    // taro 低版本进行二次编译，跳出
    if (source.includes("/*#__PURE__*/") ||
        source.includes("react/jsx-runtime")) {
        return source;
    }
    const originFileHash = (0, utils_1.crytoCode)(source);
    if (cachedPageCode.get(originFileHash)) {
        // console.log("导出缓存");
        return cachedPageCode.get(originFileHash);
    }
    // 全局级别过滤无需注入的页面
    if ((0, utils_1.verdictExclude)(options.excludePages, pagePath))
        return source;
    // 全局级别过滤保留注入的页面
    if (!(0, utils_1.verdictInclude)(options.includePages, pagePath))
        return source;
    // 注入全局组件配置信息
    if (!globalComponentConfigs) {
        const configs = (0, components_handler_1.getGlobalComponents)(options.componentsPath || "", pagePath);
        globalComponentConfigs = configs;
    }
    if (!globalComponentConfigs.length)
        return source;
    const ast = (0, ast_helper_1.code2ast)(source);
    const exportDefaultNode = (0, ast_helper_1.getDefaultExportNode)(ast);
    if (!exportDefaultNode) {
        (0, helper_1.printLog)("warning" /* processTypeEnum.WARNING */, `找不到默认导出,页面组件应通过全局默认导出(export default XX)，该页( ${pagePath} )将跳过自动插入全局组件`, filePath);
        return source;
    }
    const finallyInjectComponent = (0, components_handler_1.filterInjectedComponents)(ast, filePath, globalComponentConfigs, Object.entries(webpackAlias));
    (0, ast_inject_handler_1.injectImportTaroBlockComponent)(ast);
    (0, ast_inject_handler_1.injectImportComponents)(ast, finallyInjectComponent);
    (0, ast_inject_handler_1.injectComponentTag)(exportDefaultNode.get("declaration"), finallyInjectComponent, filePath);
    const injectedSource = (0, ast_helper_1.ast2code)(ast);
    const newFileHash = (0, utils_1.crytoCode)(injectedSource);
    cachedPageCode.set(newFileHash, injectedSource);
    cachedPageCode.set(originFileHash, injectedSource);
    return injectedSource;
}
exports.default = handleInjectComponents;
//# sourceMappingURL=inject.js.map