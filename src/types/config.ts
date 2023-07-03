export interface LogConfig {
  enable: boolean
  level: 'info' | 'warn' | 'error'
}

export interface CacheConfig {
  /** 是否使用缓存 */
  enable?: boolean
  /** 缓存在哪里 */
  cacheDir?: string
}

export type SelectorType = (string | RegExp)

export interface CSSModuleInfo {
  filename: string
  scoped: boolean
}

export interface ImmutablesConfig {
  /** 配置公共的样式文件或者目录，将其中所有的样式都设置为不可变 */
  libs?: string[]
  /** 通过字符串或正则匹配样式类名，来设置不可变 */
  selectors?: string[]
  /** 从不可变配置中排除 */
  excludeSelectors?: SelectorType[]
}

export type SupportSyntax = 'css' | 'less' | 'scss' | 'sass'

export interface CheckerOptions {
  /** 是否开启功能 */
  enable?: boolean
  /** 声明项目根目录 */
  projectRoot: string
  suffixes?: string[]
  /** 声明哪些样式类不可被覆盖 */
  immutables: ImmutablesConfig
  /** 声明哪些文件不校验 */
  excludeRules?: RegExp[]
  /** 缓存配置 */
  cache?: CacheConfig
  /** 告警相关配置 */
  log?: Partial<Record<'console' | 'reporter', boolean | Partial<LogConfig>>>
}
