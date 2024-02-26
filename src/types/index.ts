import * as t from "@babel/types";
import { ParseResult } from "@babel/parser";

export interface InjectOptions {
  /**
   * 是否开启插件
   */
  enable?: boolean;
  /**
   * 需要被注入的页面集合
   * @description 全局范围下允许被注入的页面路由集合,要求书写方式与router中的路径相同或是Glob匹配规则
   * @example includePages: ["pages/demo/index", "pages/index/*"]
   */
  includePages?: string[];
  /**
   * 不需要被注入的页面集合
   * @description 全局范围下不允许被注入的页面路由集合,要求书写方式与router中的路径相同或是Glob匹配规则
   * @example excludePages: ["pages/demo/index", "pages/index/*"]
   */
  excludePages?: string[];
  /**
   * 被注入的通用组件文件夹路径
   * @description 默认为 taro 项目下 src/_inject 文件夹
   * @example path.resolve(process.cwd(), "src/_inject")
   */
  componentsPath?: string;
  /**
   * 自定义处理需要被注入的页面
   */
  customValidate?: (filePath: string) => boolean;
}

export type TARO_ENV =
  | "weapp"
  | "swan"
  | "alipay"
  | "tt"
  | "qq"
  | "jd"
  | "h5"
  | "rn";

export interface InjectComponentOptions {
  enable: boolean;
  entry: string;
  /**
   * 标签名
   */
  tagName?: string;
  injectPosition?: "bottom" | "top";
  injectEnv?: TARO_ENV[];
  includePages?: string[];
  excludePages?: string[];
  customValidate?: (filePath: string) => boolean;
}

export interface ComponentOptionArray extends Array<InjectComponentOptions> {
  __import_path__?: Record<string, InjectComponentOptions>;
}

export type AstCodes = ParseResult<t.File>;
