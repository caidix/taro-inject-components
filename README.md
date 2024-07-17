# Taro3 全局组件注入插件

## 全局注入插件

> 全局注入插件用于为每个页面自动注入一些全局组件、方法。思路来源于前司小程序插件，于此基础之上完善更进以满足全局注入某些吐司、防控等业务需求。目前实践范围仅为小程序端，H5端由于可以直接注入根目录，未使用。

#### 安装

> npm i @caidix/taro-loader-component-inject -D

#### 最简 DEMO 看这里

[DEMO](https://github.com/caidix/taro-inject-components/tree/main)

#### 使用前置条件

1. Taro 3.6.0 以上版本， React18 开发方式
2. 插件为 Webpack Loader，仅支持采用 Webpack 进行打包编译

#### 添加配置

```javascript
// config/index.js
const config = {
  // ...
  mini: {
    webpackChain(chain) {
      chain.module
        .rule("script")
        .test(/\.[tj]sx?$/i)
        .use("taro-loader-component-inject")
        .loader("@caidix/taro-loader-component-inject")
        .options({
          // 是否使用
          enable: true,
          // 不写参数默认全局
          includePages: ["pages/index/index"],
        })
        .end();
    },
  },
  // ...
};
```

#### 配置参数说明 options

| 属性           | 说明                                                                                                                                 | 类型                          | 默认值 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------ |
| enable         | 是否使用插件                                                                                                                         | boolean                       | false  |
| componentsPath | 全局组件存放路径，当前默认前往 src/\_inject                                                                                          | string                        |        |
| includePages   | 全局范围下允许被注入的页面路由集合,要求书写方式与 router 中的路径相同或是 [Glob 匹配规则](https://www.npmjs.com/package/minimatch)   | Array<string>                 | ``     |
| excludePages   | 全局范围下不允许被注入的页面路由集合,要求书写方式与 router 中的路径相同或是 [Glob 匹配规则](https://www.npmjs.com/package/minimatch) | Array<string>                 | ``     |
| customValidate | 自定义处理需要被注入的页面, 传入一个函数，返回 true 时该页面被注入，反之不注入                                                       | (filePath: string) => boolean | ``     |

#### 注入规则

1. 插件将会追溯页面组件 `export default XX` 中默认导出的组件，找到其最外层的 return,为其注入相应的内容, 额外的，目前仅支持存在 if return 的形式：

```javascript
// inject Component
import InjectBaby from '../xxxx'

// example
const Hello = () => {
return <View>你是一只猪</View>
}
// injected
const Hello = () => {
return <View><View>你是一只猪</View><InjectBaby /></View>
}

// example
const Hello = () => {
const i = 5;
if (i > ?) {
return <View>你不是一只猪</View>
}
return <View>你是一只猪</View>
}
// injected
const Hello = () => {
const i = 5;
if (i > ?) {
return <><View>你不是一只猪</View><InjectBaby /></>
}
return <><View>你是一只猪</View><InjectBaby /></>
}

export default Hello;

```

2. 原则上你**不应该**主动在页面中引入全局注入组件。当你在页面中手动引入了 src/\_inject（注入组件存放的文件夹） 内的组件，并且并未将该页面从配置中移除时，插件会匹配到你已手动引入从而取消注入。（该逻辑只针对页面组件，不针对自定义的小组件）

## 全局注入组件规则

> 需要全局注入的组件，需按规则写入目录： src/\_inject 文件夹内。

#### 创建步骤

1.  src/\_inject 文件夹中创建对应文件夹， 例如 global-toast

2.  创建 index.tsx 及 config.json 或是 config.{env}.json 文件

    - index.tsx / index.tt(weapp).tsx : 你要注入的组件入口文件，为默认导出 export default XX；
    - config.{env}.json： config 文件为我们建立需要被注入的组件配置文件，不存在该配置文件时组件不会被注入。 当你指定 env 配置时，将会优先读取对应环境的配置。
    - 当然，如果\_inject 下的组件没有基础配置文件也没有{env}.json 配置文件会抛出错误，如果你想避免错误提示，请创建一个 config.json，并将 enable 属性设置为 false，再认真书写针对{env}.json 这类文件的配置。

3.  当你的注入组件没有强定义环境时，插件会优先查看文件夹内是否存在该环境定义的文件去使用，例如当前为 weapp 环境，你的组件目录内存在 index.weapp.tsx 和 index.tsx 文件，插件会优先采用 index.weapp.tsx 文件

#### 组件配置参数 config.json

| 属性           | 说明                                                                                                                                                                               | 类型                                                           | 默认值               | 是否必填 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------- | -------- |
| enable         | 是否使用该组件，只有填 true 才会被注入                                                                                                                                             | boolean                                                        | false                | 否       |
| entry          | 被注入的组件的入口，按上面的创建步骤时需要填入: *entry:"index.tsx"*也可以填入*entry:"index.weapp.tsx"*当你的注入文件没有强定义环境时，插件会优先选择存在当前环境下的文件进行注入。 | string                                                         | `` | 是              |
| tagName        | 注入时的组件名                                                                                                                                                                     | string                                                         | 不填默认为文件目录名 | 否       |
| includePages   | 组件范围内允许被注入的页面路由集合,要求书写方式与 router 中的路径相同或是[Glob 匹配规则](https://www.npmjs.com/package/minimatch)                                                  | Array<string>                                                  | `` | 否              |
| excludePages   | 组件范围内不允许被注入的页面路由集合,要求书写方式与 router 中的路径相同或是[Glob 匹配规则](https://www.npmjs.com/package/minimatch)                                                | Array<string>                                                  | `` | 否              |
| injectEnv      | 组件允许被注入的环境，不写默认都注入，单个可以写字符串"weapp"，也可写数组["weapp", "qq"]                                                                                           | `weapp` / `swan` / `alipay` / `tt` / `qq` / `jd` / `h5` / `rn` |                      | 否       |
| injectPosition | 注入组件所处 jsx 的位置                                                                                                                                                            | `bottom`/`top`                                                 | `bottom`             | 否       |
| customValidate | 自定义处理需要被注入的页面, 传入一个函数，返回 true 时该页面被注入，反之不注入                                                                                                     | (filePath: string) => boolean                                  | `bottom`             | 否       |
