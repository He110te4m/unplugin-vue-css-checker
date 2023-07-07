import { readFileSync } from 'node:fs'
import type { CheckerOptions, ImmutablesConfig, SelectorType } from '../types/config'
import { SelectorCache } from '../utils/cache'
import { getAllFiles } from '../utils/file'
import { resolvePath } from '../utils/path'
import { parseSelectors } from './parse'

let cache: SelectorCache

export async function getAllSelectors(options: CheckerOptions) {
  const {
    projectRoot,
    immutables,
    cache: {
      enable = true,
      cacheDir = 'node_modules/.checker-cache',
    } = {},
  } = options

  const dir = resolvePath(projectRoot, cacheDir)
  cache = cache || new SelectorCache(dir)

  enable && await cache.load()

  await loadImmutableSelectors({
    root: projectRoot,
    immutables,
    cache,
  })

  enable && cache.store()

  return cache.all()
}

interface LoadOption {
  root: string
  immutables: ImmutablesConfig
  cache: SelectorCache
}

async function loadImmutableSelectors({ root, immutables, cache }: LoadOption) {
  const {
    libs = [],
    selectors = [],
    excludeSelectors = [],
  } = immutables

  const selectorSet = new Set<string>(selectors)

  const allFiles = libs.map(file => getAllFiles(resolvePath(root, file))).flat()

  await Promise.allSettled(
    allFiles.map(async (file) => {
      const cachedData = cache.get(file)
      if (cachedData) {
        cachedData.forEach(
          selector => selectorSet.add(selector),
        )
        return
      }

      const selectors = (await getSelectors(file))
        .filter(selector => !checkExcludeSelector(excludeSelectors, selector))

      await cache.set(file, selectors)

      selectors.forEach((selector) => {
        selectorSet.add(selector)
      })
    }),
  )

  return Array.from(selectorSet)
}

async function getSelectors(file: string) {
  const content = readFileSync(file, 'utf8').toString()

  return parseSelectors(content, file)
}

function checkExcludeSelector(excludeRules: SelectorType[], selector: string) {
  return excludeRules.some(
    rule =>
      typeof rule === 'string'
        ? rule === selector
        : rule.test(selector),
  )
}
