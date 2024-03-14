import { getOptions } from "loader-utils";
import handleInjectComponents from "./inject";
import { DEFAULT_INJECT_OPTIONS } from "./utils/consts";
import { printLog, processTypeEnum, META_TYPE } from "@tarojs/helper";
import { validateTypes } from "./utils";

/**
 * Page Cache
 * Taro 旧版本会多次编译并丢失一些属性，需要提前将已有数据缓存
 * https://github.com/NervJS/taro/pull/14380
 */
const cachedPages = new Map<string, Record<string, string>>();

export default function(source) {
  let options = getOptions(this);
  if (options && !validateTypes(options, "Object")) {
    printLog(
      processTypeEnum.ERROR,
      "\n❌ 全局注入插件加载失败 :: options 必须为 Object 类型"
    );
    return;
  }
  // printLog(
  //   processTypeEnum.ERROR,
  //   "\n❌ 全局注入插件加载失败 :: options 必须为 Object 类型"
  // );
  options = {
    ...DEFAULT_INJECT_OPTIONS,
    ...options,
  };

  const { resourcePath: filePath, _module = {} } = this;

  const cachedModules = cachedPages.get(filePath) || {};
  const miniType = _module.miniType || cachedModules.miniType;
  const pagePath = _module.name || cachedModules.name;

  if (!miniType) {
    return source;
  }

  if ([META_TYPE.PAGE].includes(miniType)) {
    cachedPages.set(filePath, { miniType, name: pagePath });
    const webpackAlias = this._compiler.options?.resolve?.alias;

    try {
      return handleInjectComponents(
        source,
        options,
        filePath,
        pagePath,
        webpackAlias
      );
    } catch (error) {
      console.log(error);
      return source;
    }
  }

  return source;
}
