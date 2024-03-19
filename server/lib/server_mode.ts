import { fileURLToPath } from 'node:url'
import { absolutePath } from '#lib/absolute_path'
import { newError } from '#lib/error/error'

// We assume that serverPath has the right value to avoid having to rely
// on the server file itself to declare its path, as that would be too light
// or require circular dependencies
const serverPathWithoutExtension = absolutePath('server', 'server')

// but this assumption needs to be confirmed, so that when the server root file
// is renamed, the serverPath value above is updated
export function confirmServerPath (url) {
  const realServerPath = fileURLToPath(url)
  if (!realServerPath.includes(serverPathWithoutExtension)) {
    throw newError('serverPath needs to be updated', 500, { serverPathWithoutExtension, realServerPath })
  }
}

export const serverMode = process.argv[1].includes(serverPathWithoutExtension)
