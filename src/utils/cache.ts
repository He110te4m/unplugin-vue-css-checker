import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ensurePath } from './file'
import { getFileHash } from './hash'

interface CacheItem {
  hash: string
  selectors: string[]
}

/** 选择器缓存类 */
export class SelectorCache {
  private cache: Map<string, CacheItem>
  private cacheDir: string

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir
    this.cache = new Map()
  }

  get(file: string): CacheItem['selectors'] | undefined
  get(file: string, defaultValue: CacheItem['selectors']): CacheItem['selectors']
  get(file: string, defaultValue?: CacheItem['selectors'] | undefined): CacheItem['selectors'] | undefined {
    return this.cache.get(file)?.selectors ?? defaultValue
  }

  async set(file: string, selectors: string[]): Promise<void> {
    const hash = await getFileHash(file)

    this.cache.set(file, { hash, selectors })
  }

  all() {
    const selectors = Array.from(this.cache.values())
      .map(({ selectors }) => selectors)
      .flat()

    return Array.from(new Set(selectors))
  }

  /**
   * 加载缓存数据
   * TODO: 后续关注下性能，是否有必要换成异步的
   */
  async load() {
    if (!existsSync(this.cacheDir))
      return

    const cacheKeys = Array.from(this.cache.keys())

    const list = readdirSync(this.cacheDir)
      .filter(filename => !cacheKeys.includes(this.filenameToKey(filename)))
      .map(async (filename) => {
        const content = readFileSync(join(this.cacheDir, filename), 'utf8').toString()
        let data: CacheItem = { hash: '', selectors: [] }
        try {
          data = JSON.parse(content)
        }
        catch (error) {
        }

        const newHash = await getFileHash(filename)
        if (newHash && newHash === data.hash)
          this.cache.set(filename, data)
      })

    await Promise.allSettled(list)
  }

  store() {
    ensurePath(this.cacheDir)
    Array.from(this.cache.keys())
      .forEach((key) => {
        const filename = this.keyToFilename(key)
        const content = JSON.stringify(this.cache.get(key) ?? {})

        writeFileSync(join(this.cacheDir, filename), content)
      })
  }

  private filenameToKey(filename: string) {
    return filename.replace(/\_{3}/g, '/')
  }

  private keyToFilename(key: string) {
    return key.replace(/[\\\/]/g, '___')
  }
}
