import { fileURLToPath } from 'node:url'
import { absolutePath } from '#lib/absolute_path'
import { error_ } from '#lib/error/error'

// We assume that serverPath has the right value to avoid having to rely
// on the server file itself to declare its path, as that would be too light
// or require circular dependencies
const serverPath = absolutePath('server', 'server.js')

// but this assumption needs to be confirmed, so that when the server root file
// is renamed, the serverPath value above is updated
export function confirmServerPath (url) {
  const realServerPath = fileURLToPath(url)
  if (serverPath !== realServerPath) {
    throw error_.new('serverPath needs to be updated', 500, { serverPath, realServerPath })
  }
}

export const serverMode = process.argv[1] === serverPath
