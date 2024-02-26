import { InjectComponentOptions, InjectOptions, TARO_ENV } from "../types";
import * as path from "path";

export const LOADER_NAME = "taro-loader-component-inject";

export const DEFAULT_INJECT_OPTIONS: InjectOptions = {
  enable: false,
  includePages: [],
  excludePages: [],
  componentsPath: path.resolve(process.cwd(), "src/_inject"),
};

export const DEFAULT_COMPONENT_CONFIG: InjectComponentOptions = {
  entry: "index.tsx",
  injectPosition: "bottom",
  includePages: [],
  excludePages: [],
  enable: true,
};

/** Taro 环境变量 */
export const ENV = (process.env.TARO_ENV as TARO_ENV) || "";

export const UNINJECT_TAGS = {
  webView: true,
};
