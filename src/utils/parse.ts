import { extname } from 'node:path'
import type { CSSModuleInfo } from '../types/config'

/** 根据模块 ID 解析文件信息 */
export function parseModuleInfo(id: string, suffixes: string[]): { isValid: false } | ({ isValid: true } & CSSModuleInfo) {
  let info: URL

  try {
    info = new URL(`http://test.com${id}`)
  }
  catch (error) {
    return { isValid: false }
  }

  const { pathname: filename, search, searchParams: query } = info
  const type = query.get('type')
  if (
    suffixes.some(suffix => filename.endsWith(suffix))
    || (filename.endsWith('.vue') && type === 'style')
  ) {
    const ext = extname(search) || '.css'
    const fileExt = extname(filename)

    return {
      isValid: true,
      filename: fileExt === '.vue'
        ? filename + ext
        : filename,
      scoped: query.get('scoped') === 'true',
    }
  }

  return { isValid: false }
}
