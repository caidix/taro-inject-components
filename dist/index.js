"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("@tarojs/helper");
const utils_1 = require("./utils");
const consts_1 = require("./utils/consts");
const loader_1 = require("./loader");
exports.default = (chain, options) => {
    if (options && !(0, utils_1.validateTypes)(options, "Object")) {
        (0, helper_1.printLog)("error" /* processTypeEnum.ERROR */, "\n❌ 全局注入插件加载失败 :: options 必须为 Object 类型");
        return;
    }
    const _options = Object.assign({ DEFAULT_INJECT_OPTIONS: consts_1.DEFAULT_INJECT_OPTIONS }, options);
    chain.module
        .rule("script")
        .test(/\.[tj]sx?$/i)
        .use(consts_1.LOADER_NAME)
        .loader(loader_1.default)
        .options(_options)
        .end();
};
//# sourceMappingURL=index.js.map