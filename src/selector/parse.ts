import type { AtRule, Container, Plugin } from 'postcss'
import postcss from 'postcss'
import { plugins, selectorParser, syntax } from '../configs/css'

export async function parseSelectors(content: string, file: string): Promise<string[]> {
  const set = new Set<string>()

  // postcss 提取文件内容，解析出所有的选择器追加到 set 中
  const onWalkSelector = (selector: string) => {
    selectorParser((root) => {
      root.walk((node) => {
        const selectorName = getSelectorByNode(node)
        selectorName && set.add(selectorName)
      })
    }).processSync(selector)
  }

  await postcss(
    plugins.concat(
      selectorWalkPlugin(onWalkSelector),
    ),
  ).process(content, { syntax, from: file })

  return Array.from(set)
}

/** postcss 遍历选择器插件 */
export function selectorWalkPlugin(cb: (selector: string) => void): Plugin {
  return {
    postcssPlugin: 'postcss-plugin-selector-walk',
    Rule: (rule) => {
      if (!isAtRule(rule.parent) || !isKeyFrames(rule.parent))
        cb(rule.selector)
    },
  }
}

/** 判断是否为 @ 规则 */
function isAtRule(rule?: Container): rule is AtRule {
  return rule?.type === 'atrule'
}

/** 判断是否为动画 */
function isKeyFrames(rule: AtRule) {
  return /-?keyframes$/.test(rule.name)
}

function getSelectorByNode(node: selectorParser.Node): string | undefined {
  // 只提取类名
  if (node.type === 'class')
    return node.value
}
