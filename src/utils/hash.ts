import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'

export async function getFileHash(filename: string): Promise<string> {
  if (!existsSync(filename))
    return ''

  const hash = createHash('sha1')
  const rs = createReadStream(filename)

  return new Promise((resolve, reject) => {
    rs.on('error', reject)
    rs.on('data', chunk => hash.update(chunk))
    rs.on('end', () => resolve(hash.digest('hex')))
  })
}
