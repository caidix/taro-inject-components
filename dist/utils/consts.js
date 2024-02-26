"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNINJECT_TAGS = exports.ENV = exports.DEFAULT_COMPONENT_CONFIG = exports.DEFAULT_INJECT_OPTIONS = exports.LOADER_NAME = void 0;
const path = require("path");
exports.LOADER_NAME = "taro-loader-component-inject";
exports.DEFAULT_INJECT_OPTIONS = {
    enable: false,
    includePages: [],
    excludePages: [],
    componentsPath: path.resolve(process.cwd(), "src/_inject"),
};
exports.DEFAULT_COMPONENT_CONFIG = {
    entry: "index.tsx",
    injectPosition: "bottom",
    includePages: [],
    excludePages: [],
    enable: true,
};
/** Taro 环境变量 */
exports.ENV = process.env.TARO_ENV || "";
exports.UNINJECT_TAGS = {
    webView: true,
};
//# sourceMappingURL=consts.js.map