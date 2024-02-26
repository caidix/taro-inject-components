import { getOptions } from "loader-utils";
import handleInjectComponents from "./inject";
const { META_TYPE } = require("@tarojs/helper");

/**
 * Page Cache
 * Taro 旧版本会多次编译并丢失一些属性，需要提前将已有数据缓存
 * https://github.com/NervJS/taro/pull/14380
 */
const cachedPages = new Map<string, Record<string, string>>();

export default function loader(source) {
  const options = getOptions(this);
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

    return handleInjectComponents(
      source,
      options,
      filePath,
      pagePath,
      webpackAlias
    );
  }

  return source;
}
