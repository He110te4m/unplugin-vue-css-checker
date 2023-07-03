<!-- omit in toc -->
# 样式污染检查插件

- [安装](#安装)
  - [Vite](#vite)
  - [Rollup](#rollup)
  - [Webpack](#webpack)
  - [vue-cli](#vue-cli)
  - [esbuild](#esbuild)
- [使用示例](#使用示例)
- [工作原理](#工作原理)
- [为什么不检查此类污染](#为什么不检查此类污染)
  - [不检查 scoped 样式](#不检查-scoped-样式)
  - [为什么不检查多个文件使用同一个非公共样式的类名](#为什么不检查多个文件使用同一个非公共样式的类名)
  - [为什么不检查 ID、伪类、伪元素、标签等选择器](#为什么不检查-id伪类伪元素标签等选择器)

## 安装

```bash
npm i -D unplugin-vue-css-checker
```

### Vite

```ts
import CSSChecker from 'unplugin-vue-css-checker/vite'

export default defineConfig({
  plugins: [
    CSSChecker({ /* options */ }),
  ],
})
```

### Rollup

```ts
import CSSChecker from 'unplugin-vue-css-checker/rollup'

export default {
  plugins: [
    CSSChecker({ /* options */ }),
  ],
}
```

### Webpack

```ts
module.exports = {
  plugins: [
    require('unplugin-vue-css-checker/webpack')({ /* options */ }),
  ],
}
```

### vue-cli

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-vue-css-checker/webpack')({ /* options */ }),
    ],
  },
}
```

### esbuild

```ts
import { build } from 'esbuild'
import CSSChecker from 'unplugin-vue-css-checker/esbuild'

build({
  plugins: [CSSChecker({ /* options */ })]
})
```

## 使用示例

```typescript
import { defineConfig, loadEnv } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const isDev = command === 'serve'

  return {
    plugins: [
      createVuePlugin(),
      cssChecker({
        // 声明插件检查的启动时机，由于此插件检查不通过时会终止构建，不推荐直接用 true
        // 为了避免影响构建，此配置默认为 false
        enable: isDev || !!env.VITE_CHECK_CSS,

        // 声明项目根目录，必填
        projectRoot: __dirname,

        // 声明需要检查哪些文件的后缀，默认检查 `.css` 、 `.pcss` 、 `.postcss` 、 `.less` 、 `.scss` 、 `.sass`
        suffixes: ['.css', '.less'],

        // 配置公共样式，必填
        immutables: {
          libs: [
            // 声明组件库的样式不允许被覆盖
            'node_modules/element-ui/lib/theme-chalk/index.css',
            // 声明项目内的公共样式不允许被覆盖
            'src/styles',
          ],

          // 手动指定公共类名不允许被覆盖
          selectors: ['dark'],

          // 指定可以被覆盖的类名
          excludeSelectors: [
            '.color-red'.
          ],
        },

        // 声明哪些文件不校验，比如公共样式
        excludeRules: [
          /windi\.css$/,
          /src[\\\/]styles/,
        ],
      }),
    ],
  }
})
```

## 工作原理

> “规则”的定义： `.common-btn { color: red; }` 即为一条规则， `.common-btn, .custom-btn { color: red; }` 为两条规则

1. 当构建工具进行 `buildStart` 时，收集所有公共样式类名。
2. 当构建工具进行 `transform` 时，开始针对每个文件做校验。
3. 如果 `enable` 不为 `true` 或者文件后缀不是支持的后缀，并且不是 `vue` 文件的 `style` 代码块的话，则结束。
4. 判断是否为 `vue` 文件中的 `scoped` 样式，是的话结束。
5. 将 `CSS` 代码解析，提取规则。
6. 判断每条规则中，是否有规则所有的 `class` 选择器都是公共样式类名，是的话标记为样式污染。

## 为什么不检查此类污染

### 为什么不检查 scoped 样式？

1. scoped 会添加属性选择器，即使使用 `/deep/` 透传，也会有，所以污染的范围有限。
2. 如果针对 slot 做检查，成本较高，需要运行时检查 slot 内容，违背本插件初衷。

### 为什么不检查多个文件使用同一个非公共样式的类名？

1. vite 是 bundless 的，除非 build，否则无法获取所有的文件信息，无法在 dev 时就知道其他文件使用了相同的类名。
2. 如果预先扫描所以文件可以做到，但是对应的开销与收益不成比例，暂不支持。
3. 如果确实有此场景，可以通过自定义公共样式类名的形式来处理。

### 为什么不检查 ID、伪类、伪元素、标签等选择器？

ID 选择器是由于 HTML 中元素 ID 必须唯一，不太可能被覆盖。

其他的选择器一般不会单独工作，都需要与 class 一起工作，所以暂不计划检查。
