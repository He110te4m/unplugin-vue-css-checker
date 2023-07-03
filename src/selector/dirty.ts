import postcss from 'postcss'
import { plugins, selectorParser, syntax } from '../configs/css'
import { selectorWalkPlugin } from './parse'

interface CheckDirtyOption {
  file: string
  content: string
  immutableSelectors: string[]
}

export async function getDirtySelectors({ content, file, immutableSelectors }: CheckDirtyOption): Promise<string[]> {
  const dirtySet = new Set<string>()

  const onWalkSelector = (selector: string) => {
    selectorParser((root) => {
      // root 下每个 nodes 对应每条规则
      // `.a, .b` 会让 rott.nodes.length 为 2,
      root.nodes.forEach((selector) => {
        // 检查每条规则是否含有污染
        if (checkDirty(selector, immutableSelectors))
          dirtySet.add(selector.toString())
      })
    })
      .processSync(selector)
  }

  await postcss(
    plugins.concat(selectorWalkPlugin(onWalkSelector)),
  )
    .process(content, { from: file, syntax })

  return Array.from(dirtySet)
}

function checkDirty(selector: selectorParser.Selector, immutableSelectors: string[]) {
  let initState = false
  const hasClass = selector.some(node => node.type === 'class')

  selector.walkClasses((node) => {
    initState = initState || !immutableSelectors.includes(node.value)
  })

  return hasClass && !initState
}
