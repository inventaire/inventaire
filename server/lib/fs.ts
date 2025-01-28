import { stat, unlink, mkdir } from 'node:fs/promises'
import { promisify } from 'node:util'
import mvWithCallback from 'mv'
import type { Path } from '#types/common'

export const mv = promisify(mvWithCallback)
// Using 'unlink' instead of 'rm' until the minimal node version gets above v14.14.0
// See https://nodejs.org/api/fs.html#fs_fspromises_rm_path_options
export const rm = unlink
export const getContentLength = src => stat(src).then(({ size }) => size)

export async function mkdirp (path: Path) {
  return mkdir(path, { recursive: true })
}

export async function exists (path: Path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export const fileOwnerOnlyReadWriteMode = 0o600
