import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'

/** 确保目录存在 */
export function ensurePath(path: string) {
  if (existsSync(path))
    return

  ensurePath(dirname(path))
  mkdirSync(path)
}

export function getAllFiles(path: string): string[] {
  if (!isAbsolute(path) || !existsSync(path))
    throw new Error(`${path} is not a path`)

  return getFiles(path)
}

function getFiles(path: string): string[] {
  const stat = statSync(path)
  if (stat.isFile())
    return [path]
  else if (!stat.isDirectory())
    return []

  const files: string[] = []

  return readdirSync(path)
    .reduce(
      (list, item) => {
        const fullPath = join(path, item)

        return list.concat(getFiles(fullPath))
      },
      files,
    )
}
