"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterInjectedComponents = exports.getGlobalComponents = void 0;
/** 公共注入组件操作函数集 */
const fs = require("fs");
const path = require("path");
const traverse_1 = require("@babel/traverse");
const utils_1 = require("../utils");
const consts_1 = require("../utils/consts");
const customFileAlias = (process.env.INJECT_COMPONENT_ALIAS || "").toLocaleLowerCase();
const getGlobalComponents = (componentFilePath, pagePath) => {
    if (!fs.existsSync(componentFilePath))
        return [];
    const compsDir = fs.readdirSync(componentFilePath);
    const retConfig = [];
    // 全局组件路径-配置枚举
    retConfig.__import_path__ = {};
    for (const compDirName of compsDir) {
        const compDir = path.join(componentFilePath, compDirName);
        const stat = fs.statSync(compDir);
        if (!stat.isDirectory())
            continue;
        const configPath = path.join(compDir, "config.json");
        let configCustomPath = path.join(compDir, `config.${customFileAlias}.json`);
        const comConfig = Object.assign({}, consts_1.DEFAULT_COMPONENT_CONFIG);
        // 获取组件级别配置信息 - 优先获取config.{自定义私有化参}.json的数据
        try {
            if (!fs.existsSync(configCustomPath)) {
                if (!fs.existsSync(configPath)) {
                    throw new Error("组件配置不存在");
                }
                configCustomPath = configPath;
            }
            const config = JSON.parse(fs.readFileSync(configCustomPath, { encoding: "utf-8" }));
            Object.assign(comConfig, config);
        }
        catch (error) {
            console.error(error);
        }
        // 组件/文件名转驼峰并增加注入前缀，避免出现重名的问题
        comConfig.tagName = (0, utils_1.toUpperCamelCase)(comConfig.tagName || compDirName);
        comConfig.tagName = `Inject_${comConfig.tagName}`;
        // 入口路径绝对化
        comConfig.entry = path.normalize(path.join(compDir, comConfig.entry));
        let entryParse = path.parse(comConfig.entry);
        const afterExt = entryParse.name.split(".")[1];
        let hasEnvPage = false;
        if (!afterExt && consts_1.ENV) {
            entryParse.name = entryParse.name + "." + consts_1.ENV;
            delete entryParse["base"];
            const envEntry = path.format(entryParse);
            if (fs.existsSync(envEntry)) {
                comConfig.entry = envEntry;
                hasEnvPage = true;
            }
        }
        if (!hasEnvPage && !fs.existsSync(comConfig.entry))
            continue;
        /**
         * 单组件级别页面过滤
         */
        if ((0, utils_1.verdictPass)(comConfig, pagePath) || !comConfig.enable)
            continue;
        retConfig.push(Object.assign({}, comConfig));
        retConfig.__import_path__[comConfig.entry] = comConfig;
    }
    return retConfig;
};
exports.getGlobalComponents = getGlobalComponents;
/**
 * 过滤已经被引入的全局组件
 * @param {*} comConfigs
 * @param {*} ast
 * @param {*} alias
 */
const filterInjectedComponents = (ast, filePath, comConfigs, aliasMaping) => {
    const importPathMap = Object.assign({}, comConfigs.__import_path__);
    let remainComp = comConfigs.length;
    (0, traverse_1.default)(ast, {
        // 将import的路径替换成绝对路径后与组件的绝对路径进行比对，查看是否为同一引入
        ImportDeclaration(fileNode) {
            const absolutePath = (0, utils_1.toAbsolutePath)(fileNode.node.source.value, filePath, aliasMaping);
            if (importPathMap[absolutePath]) {
                delete importPathMap[absolutePath];
                remainComp--;
            }
            if (remainComp <= 0) {
                fileNode.stop();
            }
        },
    });
    const newConfigs = Object.values(importPathMap);
    newConfigs.__import_path__ = importPathMap;
    return newConfigs;
};
exports.filterInjectedComponents = filterInjectedComponents;
//# sourceMappingURL=components-handler.js.map