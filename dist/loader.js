"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loader_utils_1 = require("loader-utils");
const inject_1 = require("./inject");
const { META_TYPE } = require("@tarojs/helper");
/**
 * Page Cache
 * Taro 旧版本会多次编译并丢失一些属性，需要提前将已有数据缓存
 * https://github.com/NervJS/taro/pull/14380
 */
const cachedPages = new Map();
function loader(source) {
    var _a, _b;
    const options = (0, loader_utils_1.getOptions)(this);
    const { resourcePath: filePath, _module = {} } = this;
    const cachedModules = cachedPages.get(filePath) || {};
    const miniType = _module.miniType || cachedModules.miniType;
    const pagePath = _module.name || cachedModules.name;
    if (!miniType) {
        return source;
    }
    if ([META_TYPE.PAGE].includes(miniType)) {
        cachedPages.set(filePath, { miniType, name: pagePath });
        const webpackAlias = (_b = (_a = this._compiler.options) === null || _a === void 0 ? void 0 : _a.resolve) === null || _b === void 0 ? void 0 : _b.alias;
        return (0, inject_1.default)(source, options, filePath, pagePath, webpackAlias);
    }
    return source;
}
exports.default = loader;
//# sourceMappingURL=loader.js.map