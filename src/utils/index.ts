import { minimatch } from "minimatch";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { ENV } from "./consts";

export function validateTypes(param: any, type: string) {
  const toString = Object.prototype.toString;
  return toString.call(param).slice(8, -1) === type;
}

/**
 * 从一组页面路径定义数组中判断有没有命中指定的文件路径,
 * 默认为 false
 * @param {string[]} pages 页面相对路径 or Glob规则字串数组
 * @param {string} pagePath 页面 router 相对路径
 * @return {boolean}
 */
export const verdictExclude = (
  pages: string[] | undefined,
  pagePath: string
) => {
  if (!pages || !pages.length) return false;
  return !!pages.find((page) => minimatch(pagePath, page));
};

/**
 * 从一组页面路径定义数组中判断有没有命中指定的文件路径,
 * 默认为 true
 * @param {string[]} pages 页面相对路径 or Glob规则字串数组
 * @param {string} pagePath 页面 router 相对路径
 * @return {boolean}
 */
export const verdictInclude = (
  pages: string[] | undefined,
  pagePath: string
) => {
  if (!pages || !pages.length) return true;
  return !!pages.find((page) => minimatch(pagePath, page));
};

/**
 * 过滤校验逻辑
 * @param {*} config
 * @param {*} pagePath
 * @returns {boolean}
 */
export const verdictPass = (config, pagePath) => {
  let { excludePages = [], includePages = [], injectEnv } = config;

  if (typeof injectEnv === "string") {
    injectEnv = [injectEnv];
  }

  // 运行环境过滤
  if (injectEnv && injectEnv.length) {
    if (!injectEnv.includes(ENV)) {
      return true;
    }
  }
  // 页面过滤
  if (verdictExclude(excludePages, pagePath)) return true;
  if (!verdictInclude(includePages, pagePath)) return true;
  return false;
};

/** 唯一值 */
export const crytoCode = (code) => {
  const hash = crypto.createHash("md5");
  hash.update(code, "utf8");
  return hash.digest("hex");
};

/**
 * 生成唯一键字符串
 * @param len 生成唯一键的长度
 * @returns {string}
 */
export const randomString = (len?: number) => {
  const length: number = len || 32;
  const $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  const maxPos = $chars.length;
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd + `${new Date().getTime()}`;
};

/**
 * 去掉变量中的所有非法符号,并将命名转换成大驼峰格式,
 * 用于引入组件名和插入组件标签的生成, 默认为 InjectGlobalComp(XXXX)
 * @param {*} name
 * @return {*} string
 */
export const toUpperCamelCase = (name) => {
  try {
    return (
      name
        // 转换成小驼峰
        .replace(/[_-](\w)/g, (_, $1) => $1.toUpperCase())
        // 转换首字母
        .replace(/^.*?(\w)/, (_, $1) => $1.toUpperCase())
        // 去掉所有不合法的符号
        .replace(/[^a-zA-Z]/g, "")
    );
  } catch (error) {
    console.log(`转换 ${name} 默认组件名称失败: ${error}`);
    return `InjectGlobalComp${randomString(4)}`;
  }
};

/**
 * 获取文件所在目录
 * @description path.sep: 提供特定于平台的路径片段分隔符
 * @param {*} stringPath window下路径通常为\\ ，别的系统为/
 * @return {*}
 */
export const getDirPathFromFilePath = (stringPath) => {
  const parts = stringPath.split(path.sep);
  parts.pop();
  return parts.join(path.sep);
};

/**
 * 文件路径转绝对路径
 * @param {*} importPath 文件引入中采用的路径
 * @param {*} filePath 文件的路径
 * @param {*} aliasMaping webpack配置的alias; [
    '@tarojs/components$',
    '@tarojs/plugin-platform-tt/dist/components-react'
  ][]
 * @returns
 */
export const toAbsolutePath = (
  importPath: string,
  filePath: string,
  aliasMaping: [string, string][]
) => {
  let absolutePath = importPath;

  if (path.isAbsolute(importPath)) {
    absolutePath = importPath;
  } else if (/^\.{1,2}\//.test(importPath)) {
    // 相对路径转绝对路径
    absolutePath = path.resolve(getDirPathFromFilePath(filePath), importPath);
  } else {
    for (const [aKey, aPath] of aliasMaping) {
      if (!importPath.startsWith(aKey)) continue;
      absolutePath = importPath.replace(aKey, aPath);
      break;
    }
  }

  // 格式化路径
  absolutePath = path.normalize(absolutePath);
  const parsePath = path.parse(absolutePath);

  if (parsePath.ext) return absolutePath;
  // 添加后缀， 优先采用tsx的文件 次采用.jsx
  if (fs.existsSync(`${absolutePath}.${ENV}.tsx`))
    return absolutePath + `.${ENV}.tsx`;
  if (fs.existsSync(absolutePath + ".tsx")) return absolutePath + ".tsx";
  if (fs.existsSync(`${absolutePath}${path.sep}index.${ENV}.tsx`))
    return `${absolutePath}${path.sep}index.${ENV}.tsx`;
  if (fs.existsSync(absolutePath + path.sep + "index.tsx"))
    return absolutePath + path.sep + "index.tsx";

  if (fs.existsSync(absolutePath + `.${ENV}.jsx`))
    return absolutePath + `.${ENV}.jsx`;
  if (fs.existsSync(absolutePath + ".jsx")) return absolutePath + ".jsx";
  if (fs.existsSync(`${absolutePath}${path.sep}index.${ENV}.jsx`))
    return `${absolutePath}${path.sep}index.${ENV}.jsx`;
  if (fs.existsSync(absolutePath + path.sep + "index.jsx"))
    return absolutePath + path.sep + "index.jsx";

  return absolutePath;
};
