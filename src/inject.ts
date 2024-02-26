import { printLog, processTypeEnum } from "@tarojs/helper";
import { ComponentOptionArray, InjectOptions } from "./types";
import { crytoCode, verdictExclude, verdictInclude } from "./utils";
import { code2ast, ast2code, getDefaultExportNode } from "./utils/ast-helper";
import {
  filterInjectedComponents,
  getGlobalComponents,
} from "./commons/components-handler";
import {
  injectImportTaroBlockComponent,
  injectImportComponents,
  injectComponentTag,
} from "./commons/ast-inject-handler";

// 全局组件配置缓存 - 运行过程中理论上只需要获取一次全局配置
let globalComponentConfigs: ComponentOptionArray;

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
function handleInjectComponents(
  source: string,
  options: InjectOptions,
  filePath: string,
  pagePath: string,
  webpackAlias: Record<string, string>
) {
  if (!options.enable) {
    return source;
  }

  // taro 低版本进行二次编译，跳出
  if (
    source.includes("/*#__PURE__*/") ||
    source.includes("react/jsx-runtime")
  ) {
    return source;
  }

  const originFileHash = crytoCode(source);
  if (cachedPageCode.get(originFileHash)) {
    // console.log("导出缓存");
    return cachedPageCode.get(originFileHash);
  }

  // 全局级别过滤无需注入的页面
  if (verdictExclude(options.excludePages, pagePath)) return source;

  // 全局级别过滤保留注入的页面
  if (!verdictInclude(options.includePages, pagePath)) return source;

  // 注入全局组件配置信息
  if (!globalComponentConfigs) {
    const configs = getGlobalComponents(options.componentsPath || "", pagePath);
    globalComponentConfigs = configs;
  }

  if (!globalComponentConfigs.length) return source;

  const ast = code2ast(source);
  const exportDefaultNode = getDefaultExportNode(ast);

  if (!exportDefaultNode) {
    printLog(
      processTypeEnum.WARNING,
      `找不到默认导出,页面组件应通过全局默认导出(export default XX)，该页( ${pagePath} )将跳过自动插入全局组件`,
      filePath
    );
    return source;
  }

  const finallyInjectComponent = filterInjectedComponents(
    ast,
    filePath,
    globalComponentConfigs,
    Object.entries(webpackAlias)
  );
  injectImportTaroBlockComponent(ast);
  injectImportComponents(ast, finallyInjectComponent);
  injectComponentTag(
    exportDefaultNode.get("declaration"),
    finallyInjectComponent,
    filePath
  );

  const injectedSource = ast2code(ast);
  const newFileHash = crytoCode(injectedSource);
  cachedPageCode.set(newFileHash, injectedSource);
  cachedPageCode.set(originFileHash, injectedSource);

  return injectedSource;
}

export default handleInjectComponents;
