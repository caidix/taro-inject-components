'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var loaderUtils = require('loader-utils');
var helper = require('@tarojs/helper');
var minimatch = require('minimatch');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var generate = _interopDefault(require('@babel/generator'));
var parser = _interopDefault(require('@babel/parser'));
var traverse = _interopDefault(require('@babel/traverse'));
var t = _interopDefault(require('@babel/types'));
var template = _interopDefault(require('@babel/template'));

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var DEFAULT_INJECT_OPTIONS = {
  enable: false,
  includePages: [],
  excludePages: [],
  componentsPath: /*#__PURE__*/path.resolve( /*#__PURE__*/process.cwd(), "src/_inject")
};
var DEFAULT_COMPONENT_CONFIG = {
  entry: "index.tsx",
  injectPosition: "bottom",
  includePages: [],
  excludePages: [],
  enable: true
};
/** Taro 环境变量 */
var ENV = process.env.TARO_ENV || "";
var UNINJECT_TAGS = {
  webView: true
};

function validateTypes(param, type) {
  var toString = Object.prototype.toString;
  return toString.call(param).slice(8, -1) === type;
}
/**
 * 从一组页面路径定义数组中判断有没有命中指定的文件路径,
 * 默认为 false
 * @param {string[]} pages 页面相对路径 or Glob规则字串数组
 * @param {string} pagePath 页面 router 相对路径
 * @return {boolean}
 */
var verdictExclude = function verdictExclude(pages, pagePath) {
  if (!pages || !pages.length) return false;
  return !!pages.find(function (page) {
    return minimatch.minimatch(pagePath, page);
  });
};
/**
 * 从一组页面路径定义数组中判断有没有命中指定的文件路径,
 * 默认为 true
 * @param {string[]} pages 页面相对路径 or Glob规则字串数组
 * @param {string} pagePath 页面 router 相对路径
 * @return {boolean}
 */
var verdictInclude = function verdictInclude(pages, pagePath) {
  if (!pages || !pages.length) return true;
  return !!pages.find(function (page) {
    return minimatch.minimatch(pagePath, page);
  });
};
/**
 * 过滤校验逻辑
 * @param {*} config
 * @param {*} pagePath
 * @returns {boolean}
 */
var verdictPass = function verdictPass(config, pagePath) {
  var _config$excludePages = config.excludePages,
    excludePages = _config$excludePages === void 0 ? [] : _config$excludePages,
    _config$includePages = config.includePages,
    includePages = _config$includePages === void 0 ? [] : _config$includePages,
    injectEnv = config.injectEnv;
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
var crytoCode = function crytoCode(code) {
  var hash = crypto.createHash("md5");
  hash.update(code, "utf8");
  return hash.digest("hex");
};
/**
 * 生成唯一键字符串
 * @param len 生成唯一键的长度
 * @returns {string}
 */
var randomString = function randomString(len) {
  var length = len || 32;
  var $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  var maxPos = $chars.length;
  var pwd = "";
  for (var i = 0; i < length; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd + ("" + new Date().getTime());
};
/**
 * 去掉变量中的所有非法符号,并将命名转换成大驼峰格式,
 * 用于引入组件名和插入组件标签的生成, 默认为 InjectGlobalComp(XXXX)
 * @param {*} name
 * @return {*} string
 */
var toUpperCamelCase = function toUpperCamelCase(name) {
  try {
    return name
    // 转换成小驼峰
    .replace(/[_-](\w)/g, function (_, $1) {
      return $1.toUpperCase();
    })
    // 转换首字母
    .replace(/^.*?(\w)/, function (_, $1) {
      return $1.toUpperCase();
    })
    // 去掉所有不合法的符号
    .replace(/[^a-zA-Z]/g, "");
  } catch (error) {
    console.log("\u8F6C\u6362 " + name + " \u9ED8\u8BA4\u7EC4\u4EF6\u540D\u79F0\u5931\u8D25: " + error);
    return "InjectGlobalComp" + randomString(4);
  }
};
/**
 * 获取文件所在目录
 * @description path.sep: 提供特定于平台的路径片段分隔符
 * @param {*} stringPath window下路径通常为\\ ，别的系统为/
 * @return {*}
 */
var getDirPathFromFilePath = function getDirPathFromFilePath(stringPath) {
  var parts = stringPath.split(path.sep);
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
var toAbsolutePath = function toAbsolutePath(importPath, filePath, aliasMaping) {
  var absolutePath = importPath;
  if (path.isAbsolute(importPath)) {
    absolutePath = importPath;
  } else if (/^\.{1,2}\//.test(importPath)) {
    // 相对路径转绝对路径
    absolutePath = path.resolve(getDirPathFromFilePath(filePath), importPath);
  } else {
    for (var _iterator = _createForOfIteratorHelperLoose(aliasMaping), _step; !(_step = _iterator()).done;) {
      var _step$value = _step.value,
        aKey = _step$value[0],
        aPath = _step$value[1];
      if (!importPath.startsWith(aKey)) continue;
      absolutePath = importPath.replace(aKey, aPath);
      break;
    }
  }
  // 格式化路径
  absolutePath = path.normalize(absolutePath);
  var parsePath = path.parse(absolutePath);
  if (parsePath.ext) return absolutePath;
  // 添加后缀， 优先采用tsx的文件 次采用.jsx
  if (fs.existsSync(absolutePath + "." + ENV + ".tsx")) return absolutePath + ("." + ENV + ".tsx");
  if (fs.existsSync(absolutePath + ".tsx")) return absolutePath + ".tsx";
  if (fs.existsSync("" + absolutePath + path.sep + "index." + ENV + ".tsx")) return "" + absolutePath + path.sep + "index." + ENV + ".tsx";
  if (fs.existsSync(absolutePath + path.sep + "index.tsx")) return absolutePath + path.sep + "index.tsx";
  if (fs.existsSync(absolutePath + ("." + ENV + ".jsx"))) return absolutePath + ("." + ENV + ".jsx");
  if (fs.existsSync(absolutePath + ".jsx")) return absolutePath + ".jsx";
  if (fs.existsSync("" + absolutePath + path.sep + "index." + ENV + ".jsx")) return "" + absolutePath + path.sep + "index." + ENV + ".jsx";
  if (fs.existsSync(absolutePath + path.sep + "index.jsx")) return absolutePath + path.sep + "index.jsx";
  return absolutePath;
};

var code2ast = function code2ast(source) {
  return parser.parse(source, {
    sourceType: "module",
    ranges: true,
    plugins: ["jsx", "typescript", "classProperties"]
  });
};
var ast2code = function ast2code(ast) {
  return generate(ast).code;
};
/**
 * 创建 jSXElement nodePath
 * https://babeljs.io/docs/babel-types#jsxelement
 * @param {*} name
 * @return {*}
 */
var createJSXElement = function createJSXElement(name) {
  return t.jSXElement(t.jSXOpeningElement(t.jsxIdentifier("" + name), [], true), null, [], true);
};
/**
 * 创建 React.createElement nodePath
 * https://babeljs.io/docs/babel-types#identifier
 * @param {*} name
 * @return {*}
 */
var createReactCallExpression = function createReactCallExpression(name) {
  // 创建React、createElement两个函数node
  var reactIdentifier = t.identifier("React");
  var createElementIdentifier = t.identifier("createElement");
  // 为React函数prototype增加createElement
  var callee = t.memberExpression(reactIdentifier, createElementIdentifier);
  // 将我们要创建的组件当参传入成return <name />函数
  return t.callExpression(callee, [t.identifier(name)]);
};
/**
 * 获取默认导出块
 * @description 默认页面组件到处时应采用 export default XX 的形式导出
 * @param {*} ast
 */
var getDefaultExportNode = function getDefaultExportNode(ast) {
  var _node;
  traverse(ast, {
    ExportDefaultDeclaration: function ExportDefaultDeclaration(node) {
      _node = node;
      node.stop();
    }
  });
  return _node;
};
/**
 * 为组件包裹一个View标签: <Content /> => <View><Content /></View>
 * @param {*} node
 * @returns {*} 此时返回的根节点为<View></View>
 */
var wrapJSXClosingElement = function wrapJSXClosingElement(pathNode) {
  var fragments = t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier("View"), []), t.jsxClosingElement(t.jsxIdentifier("View")), [pathNode.node]);
  pathNode.replaceWith(fragments);
};
/**
 * 获取页面节点相关的详细绑定信息（通过绑定的路径获取-binding.path）
 * 用于获取指定变量名所对应的内容实例，如传入 name1 索引获取 const name1 = () => {} path实例
 * @param {*} node
 * @param {*} name 变量名
 * @returns {*}
 */
var getBindingNode = function getBindingNode(pathNode, name) {
  try {
    var _path = pathNode.scope.bindings[name].path;
    return _path;
  } catch (error) {
    return void 0;
  }
};

var customFileAlias = /*#__PURE__*/(process.env.INJECT_COMPONENT_ALIAS || "").toLocaleLowerCase();
var getGlobalComponents = function getGlobalComponents(componentFilePath, pagePath) {
  if (!fs.existsSync(componentFilePath)) return [];
  var compsDir = fs.readdirSync(componentFilePath);
  var retConfig = [];
  // 全局组件路径-配置枚举
  retConfig.__import_path__ = {};
  for (var _iterator = _createForOfIteratorHelperLoose(compsDir), _step; !(_step = _iterator()).done;) {
    var compDirName = _step.value;
    var compDir = path.join(componentFilePath, compDirName);
    var stat = fs.statSync(compDir);
    if (!stat.isDirectory()) continue;
    var configPath = path.join(compDir, "config.json");
    var configCustomPath = path.join(compDir, "config." + customFileAlias + ".json");
    var comConfig = _extends({}, DEFAULT_COMPONENT_CONFIG);
    // 获取组件级别配置信息 - 优先获取config.{自定义私有化参}.json的数据
    try {
      if (!fs.existsSync(configCustomPath)) {
        if (!fs.existsSync(configPath)) {
          throw new Error("组件配置不存在");
        }
        configCustomPath = configPath;
      }
      var config = JSON.parse(fs.readFileSync(configCustomPath, {
        encoding: "utf-8"
      }));
      Object.assign(comConfig, config);
    } catch (error) {
      console.error(error);
    }
    // 组件/文件名转驼峰并增加注入前缀，避免出现重名的问题
    comConfig.tagName = toUpperCamelCase(comConfig.tagName || compDirName);
    comConfig.tagName = "Inject_" + comConfig.tagName;
    // 入口路径绝对化
    comConfig.entry = path.normalize(path.join(compDir, comConfig.entry));
    var entryParse = path.parse(comConfig.entry);
    var afterExt = entryParse.name.split(".")[1];
    var hasEnvPage = false;
    if (!afterExt && ENV) {
      entryParse.name = entryParse.name + "." + ENV;
      delete entryParse["base"];
      var envEntry = path.format(entryParse);
      if (fs.existsSync(envEntry)) {
        comConfig.entry = envEntry;
        hasEnvPage = true;
      }
    }
    if (!hasEnvPage && !fs.existsSync(comConfig.entry)) continue;
    /**
     * 单组件级别页面过滤
     */
    if (verdictPass(comConfig, pagePath) || !comConfig.enable) continue;
    retConfig.push(_extends({}, comConfig));
    retConfig.__import_path__[comConfig.entry] = comConfig;
  }
  return retConfig;
};
/**
 * 过滤已经被引入的全局组件
 * @param {*} comConfigs
 * @param {*} ast
 * @param {*} alias
 */
var filterInjectedComponents = function filterInjectedComponents(ast, filePath, comConfigs, aliasMaping) {
  var importPathMap = Object.assign({}, comConfigs.__import_path__);
  var remainComp = comConfigs.length;
  traverse(ast, {
    // 将import的路径替换成绝对路径后与组件的绝对路径进行比对，查看是否为同一引入
    ImportDeclaration: function ImportDeclaration(fileNode) {
      var absolutePath = toAbsolutePath(fileNode.node.source.value, filePath, aliasMaping);
      if (importPathMap[absolutePath]) {
        delete importPathMap[absolutePath];
        remainComp--;
      }
      if (remainComp <= 0) {
        fileNode.stop();
      }
    }
  });
  var newConfigs = Object.values(importPathMap);
  newConfigs.__import_path__ = importPathMap;
  return newConfigs;
};

/**
 * 将全局组件以 import xx from "xx" 的形式注入页面
 * @param {AstCodes} ast
 * @param {ComponentOptionArray} comConfigs
 */
var injectImportComponents = function injectImportComponents(ast, comConfigs) {
  for (var _iterator = _createForOfIteratorHelperLoose(comConfigs), _step; !(_step = _iterator()).done;) {
    var com = _step.value;
    try {
      var entry = com.entry.split(path.sep).join("/");
      var astCom = template.ast("import " + com.tagName + " from '" + entry + "';");
      ast.program.body.unshift(astCom);
      // printLog(processTypeEnum.CREATE, `注入 ${com.tagName} 组件成功`);
    } catch (error) {
      helper.printLog("error" /* ERROR */, "\u6CE8\u5165 " + com.tagName + " \u7EC4\u4EF6\u5931\u8D25: " + error);
    }
  }
};
/**
 * 注入JSX元素
 * @param {*} pathNode argument为 JSXElement 类型的 ReturnStatement 实例
 * @param {*} comConfigs
 * @returns
 */
var injectJSXElement = function injectJSXElement(pathNode, comConfigs) {
  var _pathNode$node;
  if (!t.isJSXElement(pathNode) && !t.isJSXFragment(pathNode)) return;
  if (UNINJECT_TAGS[((_pathNode$node = pathNode.node) == null || (_pathNode$node = _pathNode$node.openingElement) == null || (_pathNode$node = _pathNode$node.name) == null ? void 0 : _pathNode$node.name) || ""]) return;
  wrapJSXClosingElement(pathNode);
  for (var _iterator2 = _createForOfIteratorHelperLoose(comConfigs), _step2; !(_step2 = _iterator2()).done;) {
    var com = _step2.value;
    if (com.injectPosition === "top") {
      pathNode.node.children.unshift(createJSXElement(com.tagName));
    } else {
      pathNode.node.children.push(createJSXElement(com.tagName));
    }
  }
};
var injectCallExpression = function injectCallExpression(pathNode, comConfigs, filePath) {
  var _pathNode$node2;
  // CreateElement只有最后的...children接收额外传入ReactNode，故默认只采用push形式
  if (((_pathNode$node2 = pathNode.node) == null || (_pathNode$node2 = _pathNode$node2.callee) == null || (_pathNode$node2 = _pathNode$node2.property) == null ? void 0 : _pathNode$node2.name) === "createElement") {
    var _arguments = pathNode.node.arguments;
    for (var _iterator3 = _createForOfIteratorHelperLoose(comConfigs), _step3; !(_step3 = _iterator3()).done;) {
      var com = _step3.value;
      _arguments.push(createReactCallExpression(com.tagName));
    }
    return;
  }
  var pathBody = pathNode.get("callee").get("body");
  if (pathBody.isBlockStatement()) {
    handleReturnStatement(pathBody, comConfigs, filePath);
  } else {
    injectJSXElement(pathBody, comConfigs);
  }
};
var handleInjectArgumentFromType = function handleInjectArgumentFromType(argumentPaths, comConfigs, filePath, done) {
  if (!argumentPaths) {
    return;
  }
  // return <xxx></xxx> 已认证
  if (t.isJSXElement(argumentPaths) || t.isJSXFragment(argumentPaths)) {
    injectJSXElement(argumentPaths, comConfigs);
    done && done();
    return;
  }
  // return a > 0 ? <XX/> : null; 已认证
  if (t.isConditionalExpression(argumentPaths)) {
    var consequent = argumentPaths.get("consequent");
    var alternate = argumentPaths.get("alternate");
    handleInjectArgumentFromType(consequent, comConfigs, filePath, done);
    handleInjectArgumentFromType(alternate, comConfigs, filePath, done);
    return;
  }
  // return React?.createElement -- 不接受 createElement, 兼容特殊函数场景
  if (t.isCallExpression(argumentPaths)) {
    injectCallExpression(argumentPaths, comConfigs, filePath);
    done && done();
    return;
  }
  // return { ComponentXX }
  if (t.isObjectExpression(argumentPaths)) {
    injectJSXElement(argumentPaths, comConfigs);
    done && done();
    return;
  }
  // return aa && ComponentXX || ComponentYY
  if (t.isLogicalExpression(argumentPaths)) {
    var left = argumentPaths.get("left");
    var right = argumentPaths.get("right");
    handleInjectArgumentFromType(left, comConfigs, filePath, done);
    handleInjectArgumentFromType(right, comConfigs, filePath, done);
    return;
  }
  if (t.isTSAsExpression(argumentPaths)) {
    handleTSAsExpression(argumentPaths, comConfigs, filePath);
    return;
  }
  if (t.isIdentifier(argumentPaths)) {
    handleIdentifier(argumentPaths, comConfigs, filePath);
    return;
  }
  if (t.isVariableDeclarator(argumentPaths)) {
    handleVariableDeclarator(argumentPaths, comConfigs, filePath);
  }
};
/**
 * 处理返回体代码中的 return 逻辑
 * @param {*} pathNode  XXFunction.body
 * @param {*} comConfigs
 * @returns {*}
 */
var handleReturnStatement = function handleReturnStatement(pathNode, comConfigs, filePath) {
  try {
    var canInject = false;
    var u = pathNode.get("body");
    var bodyList = u.get("body");
    bodyList.forEach(function (_node) {
      if (t.isReturnStatement(_node) && !canInject) {
        // 注入 -- 只针对函数最外层的 return 做处理
        canInject = true;
        _node.node.__GLOBAL__COMPONENT__ = "__GLOBAL__COMPONENT__";
        var argumentPaths = _node.get("argument");
        handleInjectArgumentFromType(argumentPaths, comConfigs, filePath, function () {
          _node.skip();
        });
      }
      // @ts-ignore
      if (t.isIfStatement(_node)) {
        handleReturnStatement(_node, comConfigs, filePath);
        return;
      }
    });
  } catch (error) {}
};
/**
 * 处理ts断言类型 (xx) as any => (<>xx<myComponent/></>) as any
 * @returns
 */
var handleTSAsExpression = function handleTSAsExpression(pathNode, comConfigs, filePath) {
  var _pathNode$node3;
  if ((_pathNode$node3 = pathNode.node) != null && (_pathNode$node3 = _pathNode$node3.expression) != null && _pathNode$node3.name) {
    return injectComponentTag(getBindingNode(pathNode, pathNode.node.expression.name), comConfigs, filePath);
  }
  return handleInjectArgumentFromType(pathNode.get("expression"), comConfigs, filePath);
};
/**
 * 处理 Class 类型中的render返回体， 默认 render() { return } 形式
 */
var handleClass = function handleClass(pathNode, compConfigs, filePath) {
  traverse(pathNode.node, {
    ClassMethod: function ClassMethod(_node) {
      var _node$node$key;
      if (((_node$node$key = _node.node.key) == null ? void 0 : _node$node$key.name) !== "render") return;
      handleReturnStatement(_node, compConfigs, filePath);
      _node.stop();
    }
  }, pathNode.scope, pathNode);
};
var handleIdentifier = function handleIdentifier(pathNode, comConfigs, filePath) {
  // 获取 export default XX 中的 XX
  var exportComName = pathNode.node.name;
  return injectComponentTag(getBindingNode(pathNode, exportComName), comConfigs, filePath);
};
/**
 * 处理 export default 为箭头函数时的 return；
 */
var handleArrowFunctionExpression = function handleArrowFunctionExpression(functionNode, comConfigs, filePath) {
  var functionBody = functionNode.get("body");
  // () => xx  OR () => { return xx } OR () => React.CreateElement
  if (t.isBlockStatement(functionBody.node)) {
    handleReturnStatement(functionNode, comConfigs, filePath);
    return;
  }
  if (t.isCallExpression(functionBody.node)) {
    injectComponentTag(functionNode, comConfigs, filePath);
    return;
  }
  injectJSXElement(functionBody, comConfigs);
};
/**
 * 处理字面量类型
 * 作为页面组件，其VariableDeclarator对应类型下的init值应为ArrowFunctionExpression类型
 */
var handleVariableDeclarator = function handleVariableDeclarator(pathNode, comConfigs, filePath) {
  var valuePathNode = pathNode.get("init");
  return injectComponentTag(valuePathNode, comConfigs, filePath);
};
/**
 * 将代码块注入文件 --- function|class|字面量时处理，其余递归至符合要求
 * @description 我们将遍历该页面直至最后获取导出的 ArrowFunctionExpression | FunctionDeclaration | FunctionExpression | ClassDeclaration | ClassExpression 类型做插入
 * @param {*} pathNode 导出 AST Path 实例对象,在babel中为 NodePath 对象，包含了具体信息
 * @param {*} comConfigs
 */
var injectComponentTag = function injectComponentTag(pathNode, comConfigs, filePath) {
  if (!pathNode || !pathNode.node) return;
  switch (pathNode.node.type) {
    case "Identifier":
      // 处理字面量|变量
      handleIdentifier(pathNode, comConfigs, filePath);
      break;
    case "VariableDeclarator":
      // 处理字面量函数
      handleVariableDeclarator(pathNode, comConfigs, filePath);
      break;
    case "ArrowFunctionExpression":
      // 处理箭头函数
      handleArrowFunctionExpression(pathNode, comConfigs, filePath);
      break;
    case "FunctionDeclaration": // 处理函数 function xx() { return }
    case "FunctionExpression":
      // 处理匿名函数 const xx = function() { return }
      handleReturnStatement(pathNode, comConfigs, filePath);
      break;
    case "TSAsExpression":
      // 处理Ts断言 const i = Component as string;
      handleTSAsExpression(pathNode, comConfigs, filePath);
      break;
    case "ClassDeclaration":
    case "ClassExpression":
      handleClass(pathNode, comConfigs, filePath);
      break;
    case "CallExpression":
      injectCallExpression(pathNode, comConfigs, filePath);
      break;
    case "JSXElement":
      // 特殊情况 - () => {const I = <></>; return I } 时触发
      injectJSXElement(pathNode, comConfigs);
      break;
  }
};
/**
 * 插入一个 import { View } from '@tarojs/components' 语句
 * @param {AstCodes} ast
 */
var injectImportTaroBlockComponent = function injectImportTaroBlockComponent(ast) {
  var taroComponentsImported = false;
  traverse(ast, {
    ImportDeclaration: function ImportDeclaration(__path) {
      var _path$node$specifier;
      if (__path.node.source.value !== "@tarojs/components") return;
      taroComponentsImported = true;
      var blockComponentImported = (_path$node$specifier = __path.node.specifiers) == null ? void 0 : _path$node$specifier.find(function (node) {
        return node.local.name === "View";
      });
      if (blockComponentImported) {
        __path.stop();
        return;
      }
      var specifierNames = __path.node.specifiers.map(function (sp) {
        return sp.local.name;
      });
      specifierNames.push("View");
      var importAst = template.ast("import {" + specifierNames.join(",") + "} from '@tarojs/components'");
      __path.replaceWith(importAst);
      __path.stop();
    }
  });
  if (taroComponentsImported) return;
  var importAst = template.ast("import { View } from '@tarojs/components'");
  ast.program.body.unshift(importAst);
};

// 全局组件配置缓存 - 运行过程中理论上只需要获取一次全局配置
var globalComponentConfigs;
// 页面缓存， 多次执行插件内容容易爆栈
var cachedPageCode = /*#__PURE__*/new Map();
/**
 * 自动注入全局组件
 * @param {string} source 页面字符串源码
 * @param {object} options 用户传入全局配置项
 * @param {string} filePath 当前页面路径参数
 * @param {string} pagePath 小程序路由路径参数
 * @param {object} webpackAlias Webpack alias代理设置
 */
function handleInjectComponents(source, options, filePath, pagePath, webpackAlias) {
  if (!options.enable) {
    return source;
  }
  // taro 低版本进行二次编译，跳出
  if (source.includes("/*#__PURE__*/") || source.includes("react/jsx-runtime")) {
    return source;
  }
  var originFileHash = crytoCode(source);
  if (cachedPageCode.get(originFileHash)) {
    // console.log("导出缓存");
    return cachedPageCode.get(originFileHash);
  }
  // 全局级别过滤无需注入的页面
  if (verdictExclude(options.excludePages, pagePath)) return source;
  // 全局级别过滤保留注入的页面
  if (!verdictInclude(options.includePages, pagePath)) return source;
  // 注入全局组件配置信息
  if (!globalComponentConfigs) {
    var configs = getGlobalComponents(options.componentsPath || "", pagePath);
    globalComponentConfigs = configs;
  }
  if (!globalComponentConfigs.length) return source;
  var ast = code2ast(source);
  var exportDefaultNode = getDefaultExportNode(ast);
  if (!exportDefaultNode) {
    helper.printLog("warning" /* WARNING */, "\u627E\u4E0D\u5230\u9ED8\u8BA4\u5BFC\u51FA,\u9875\u9762\u7EC4\u4EF6\u5E94\u901A\u8FC7\u5168\u5C40\u9ED8\u8BA4\u5BFC\u51FA(export default XX)\uFF0C\u8BE5\u9875( " + pagePath + " )\u5C06\u8DF3\u8FC7\u81EA\u52A8\u63D2\u5165\u5168\u5C40\u7EC4\u4EF6", filePath);
    return source;
  }
  var finallyInjectComponent = filterInjectedComponents(ast, filePath, globalComponentConfigs, Object.entries(webpackAlias));
  injectImportTaroBlockComponent(ast);
  injectImportComponents(ast, finallyInjectComponent);
  injectComponentTag(exportDefaultNode.get("declaration"), finallyInjectComponent, filePath);
  var injectedSource = ast2code(ast);
  var newFileHash = crytoCode(injectedSource);
  cachedPageCode.set(newFileHash, injectedSource);
  cachedPageCode.set(originFileHash, injectedSource);
  return injectedSource;
}

/**
 * Page Cache
 * Taro 旧版本会多次编译并丢失一些属性，需要提前将已有数据缓存
 * https://github.com/NervJS/taro/pull/14380
 */
var cachedPages = /*#__PURE__*/new Map();
function index (source) {
  var options = loaderUtils.getOptions(this);
  if (options && !validateTypes(options, "Object")) {
    helper.printLog("error" /* ERROR */, "\n❌ 全局注入插件加载失败 :: options 必须为 Object 类型");
    return;
  }
  // printLog(
  //   processTypeEnum.ERROR,
  //   "\n❌ 全局注入插件加载失败 :: options 必须为 Object 类型"
  // );
  options = _extends({}, DEFAULT_INJECT_OPTIONS, options);
  var filePath = this.resourcePath,
    _this$_module = this._module,
    _module = _this$_module === void 0 ? {} : _this$_module;
  var cachedModules = cachedPages.get(filePath) || {};
  var miniType = _module.miniType || cachedModules.miniType;
  var pagePath = _module.name || cachedModules.name;
  if (!miniType) {
    return source;
  }
  if ([helper.META_TYPE.PAGE].includes(miniType)) {
    var _this$_compiler$optio;
    cachedPages.set(filePath, {
      miniType: miniType,
      name: pagePath
    });
    var webpackAlias = (_this$_compiler$optio = this._compiler.options) == null || (_this$_compiler$optio = _this$_compiler$optio.resolve) == null ? void 0 : _this$_compiler$optio.alias;
    try {
      return handleInjectComponents(source, options, filePath, pagePath, webpackAlias);
    } catch (error) {
      console.log(error);
      return source;
    }
  }
  return source;
}

exports.default = index;
//# sourceMappingURL=taro-loader-component-inject.cjs.development.js.map
