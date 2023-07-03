import { isAbsolute, resolve } from 'node:path'

/** 解析路径为绝对路径 */
export function resolvePath(root: string, path: string): string {
  return isAbsolute(path) ? path : resolve(root, path)
}
