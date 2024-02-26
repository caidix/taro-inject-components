import { printLog, processTypeEnum } from "@tarojs/helper";
import { InjectOptions } from "./types";
import { validateTypes } from "./utils";
import { DEFAULT_INJECT_OPTIONS, LOADER_NAME } from "./utils/consts";
import loader from "./loader";

export default (chain, options?: InjectOptions) => {
  if (options && !validateTypes(options, "Object")) {
    printLog(
      processTypeEnum.ERROR,
      "\n❌ 全局注入插件加载失败 :: options 必须为 Object 类型"
    );
    return;
  }

  const _options = {
    DEFAULT_INJECT_OPTIONS,
    ...options,
  };

  chain.module
    .rule("script")
    .test(/\.[tj]sx?$/i)
    .use(LOADER_NAME)
    .loader(loader)
    .options(_options)
    .end();
};
