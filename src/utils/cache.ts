import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ensurePath } from './file'

/** 选择器缓存类 */
export class SelectorCache {
  private cache: Map<string, string[]>
  private cacheDir: string

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir
    this.cache = new Map()
  }

  get(file: string): string[] | undefined
  get(file: string, defaultValue: string[]): string[]
  get(file: string, defaultValue?: string[] | undefined): string[] | string[] | undefined {
    return this.cache.get(file) ?? defaultValue
  }

  set(file: string, data: string[]): void {
    this.cache.set(file, data)
  }

  all() {
    return Array.from(new Set(Array.from(this.cache.values()).flat()))
  }

  /**
   * 加载缓存数据
   * TODO: 后续关注下性能，是否有必要换成异步的
   */
  load() {
    if (!existsSync(this.cacheDir))
      return

    const cacheKeys = Array.from(this.cache.keys())

    readdirSync(this.cacheDir)
      .filter(filename => !cacheKeys.includes(this.filenameToKey(filename)))
      .map(filename => ({
        filename,
        content: readFileSync(join(this.cacheDir, filename), 'utf8').toString(),
      }))
      .forEach(({ filename, content }) => {
        let selectors: string[] = []

        try {
          selectors = JSON.parse(content)
        }
        catch (error) {
        }

        this.cache.set(filename, selectors)
      })
  }

  store() {
    ensurePath(this.cacheDir)
    Array.from(this.cache.keys())
      .forEach((key) => {
        const filename = this.keyToFilename(key)
        const content = JSON.stringify(this.cache.get(key) ?? [])

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
