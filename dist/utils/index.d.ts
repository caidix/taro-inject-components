export declare function validateTypes(param: any, type: string): boolean;
/**
 * 从一组页面路径定义数组中判断有没有命中指定的文件路径,
 * 默认为 false
 * @param {string[]} pages 页面相对路径 or Glob规则字串数组
 * @param {string} pagePath 页面 router 相对路径
 * @return {boolean}
 */
export declare const verdictExclude: (pages: string[] | undefined, pagePath: string) => boolean;
/**
 * 从一组页面路径定义数组中判断有没有命中指定的文件路径,
 * 默认为 true
 * @param {string[]} pages 页面相对路径 or Glob规则字串数组
 * @param {string} pagePath 页面 router 相对路径
 * @return {boolean}
 */
export declare const verdictInclude: (pages: string[] | undefined, pagePath: string) => boolean;
/**
 * 过滤校验逻辑
 * @param {*} config
 * @param {*} pagePath
 * @returns {boolean}
 */
export declare const verdictPass: (config: any, pagePath: any) => boolean;
/** 唯一值 */
export declare const crytoCode: (code: any) => string;
/**
 * 生成唯一键字符串
 * @param len 生成唯一键的长度
 * @returns {string}
 */
export declare const randomString: (len?: number | undefined) => string;
/**
 * 去掉变量中的所有非法符号,并将命名转换成大驼峰格式,
 * 用于引入组件名和插入组件标签的生成, 默认为 InjectGlobalComp(XXXX)
 * @param {*} name
 * @return {*} string
 */
export declare const toUpperCamelCase: (name: any) => any;
/**
 * 获取文件所在目录
 * @description path.sep: 提供特定于平台的路径片段分隔符
 * @param {*} stringPath window下路径通常为\\ ，别的系统为/
 * @return {*}
 */
export declare const getDirPathFromFilePath: (stringPath: any) => any;
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
export declare const toAbsolutePath: (importPath: string, filePath: string, aliasMaping: [string, string][]) => string;
