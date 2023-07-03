import { type TransformResult, createUnplugin } from 'unplugin'
import type { Options } from './types'
import { getAllSelectors } from './selector/all'
import { parseModuleInfo } from './utils/parse'
import { getDirtySelectors } from './selector/dirty'

const defaultSuffixes: string[] = [
  '.css',
  '.pcss',
  '.postcss',
  '.less',
  '.scss',
  '.sass',
]

export default createUnplugin<Options>((options) => {
  const { enable, excludeRules, suffixes = defaultSuffixes } = options
  let immutableSelectors: string[] = []

  return {
    name: 'unplugin-vue-css-checker',
    enforce: 'pre', // 必须要 pre 运行，否则 vue 处理后，CSS 会变成 JS 模块，难以解析此字符串
    async buildStart() {
    // 初始化 immutable selectors
      if (enable)
        immutableSelectors = await getAllSelectors(options)
    },
    async transform(code, id): Promise<TransformResult> {
      // 处理需要排除的文件
      if (!enable || checkExcludeFiles(id, excludeRules))
        return

      // 解析模块信息
      const result = parseModuleInfo(id, suffixes)
      // 暂时不检查 scoped ， scoped 即使通过 deep 透传，作用域也有限
      if (!result.isValid || result.scoped)
        return

      // trim 一下减少 ast 解析的工作量
      const content = code.trim()

      // 获取所有的被污染的选择器
      const dirtySelectorsStr = await getDirtySelectors({
        file: result.filename,
        content,
        immutableSelectors,
      })
      if (dirtySelectorsStr.length) {
        // 报错
        this.error(formatErrorMessage(dirtySelectorsStr))
      }
    },
  }
})

/** 检查是否为排除的文件 */
function checkExcludeFiles(file: string, excludeRules: RegExp[] = []) {
  return excludeRules
    .concat(/[\\\/]node_modules[\\\/]/)
    .some(reg => reg.test(file))
}

/** 格式化报错信息 */
function formatErrorMessage(selectors: string[]) {
  const dirtySelectorsStr = selectors
    .map(str => `\`${str.trim()}\``)
    .join('\r\n')

  return `
The existence of the following selector will contaminate the common style:
${dirtySelectorsStr}
`
}
