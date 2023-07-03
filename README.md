<!-- omit in toc -->
# Check for style contamination in the Vue project

- [Install](#install)
  - [Vite](#vite)
  - [Rollup](#rollup)
  - [Webpack](#webpack)
  - [vue-cli](#vue-cli)
  - [esbuild](#esbuild)
- [Example](#example)
- [How it works](#how-it-works)
- [Why not check for such contamination](#why-not-check-for-such-contamination)
  - [Why not check the scoped style?](#why-not-check-the-scoped-style)
  - [Why not check multiple files for class names that use the same non-public style?](#why-not-check-multiple-files-for-class-names-that-use-the-same-non-public-style)
  - [Why not check selectors for id, pseudo-classes, pseudo-elements, tag?](#why-not-check-selectors-for-id-pseudo-classes-pseudo-elements-tag)

## Install

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

## Example

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
        // Declaring when a plug-in check will start
        // Because this plugin will terminate the build if it does not pass, it is not recommended to use `true` directly.
        // default is `false`
        enable: isDev || !!env.VITE_CHECK_CSS,

        // (required) Declare the project root directory.
        projectRoot: __dirname,

        // Declares which file suffixes need to be checked, by default: `.css` 、 `.pcss` 、 `.postcss` 、 `.less` 、 `.scss` 、 `.sass`
        suffixes: ['.css', '.less'],

        // (required) To configure the common style.
        immutables: {
          libs: [
            // Styles that declare component libraries are not allowed to be overridden
            'node_modules/element-ui/lib/theme-chalk/index.css',
            // Public styles within a declaration project are not allowed to be overridden
            'src/styles',
          ],

          // Manually specifying the public class name does not allow overwriting
          selectors: ['dark'],

          // Specifies the class name that can be overridden
          excludeSelectors: [
            '.color-red'.
          ],
        },

        // Declare which files are not validated, such as public styles
        excludeRules: [
          /windi\.css$/,
          /src[\\\/]styles/,
        ],
      }),
    ],
  }
})
```

## How it works

> The definition of "Rule": `.common-btn { color: red; }` is a rule, `.common-btn, .custom-btn { color: red; }` is two rules.

1. Collect all common style class names when the bundle tool `buildStart` .
2. As the bundle tool `transform` , it begins to validate each file.
3. Ends if `enable` is not `true` or the file suffix is not a supported suffix and is not the `style` block of the `.vue` file.
Four. Determines whether the 'scoped' style is in the 'Vue' file, and ends if it is.
5. Parse the `CSS` code to extract the rules.
6. Determine if there is a rule in each rule that all `class` selectors are common style class names, and if so, mark them as style polluters.

## Why not check for such contamination

### Why not check the scoped style?

1. Scoped adds attribute selectors, even if you use `/deep/` pass-through, so the scope of contamination is limited.
2. If the slot to do checks, the cost is high, the need to check the contents of the slot at runtime, contrary to the original intention of this plugin.

### Why not check multiple files for class names that use the same non-public style?

1. Vite is bundless, so we can't get all the file information unless we build it, and we can't know at Dev Time that other files are using the same class name.
2. If pre-scanning all files can be done, but the corresponding costs and benefits are not proportional, not yet supported.
3. If this scenario does exist, it can be handled in the form of a custom common style class name.

### Why not check selectors for id, pseudo-classes, pseudo-elements, tag?

The ID selector is unlikely to be overridden because the element ID must be unique in the HTML.

The other selectors don't usually work alone, and they all work with classes, so no checking is planned.
