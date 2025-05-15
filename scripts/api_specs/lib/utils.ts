import { newError } from '#lib/error/error'
import { warn } from '#lib/utils/logs'
import type { EndpointSpecs } from '#types/api/specifications'

const inconsistentNameByEndpoint = {
  lists: 'listings',
}

const standaloneEndpoint = [
  'config',
  'feedback',
  'i18n',
]

const differentDirectory = {
  token: 'auth',
}

const ignored = [
  'oauth',
  'submit',
  'tests*',
  '*',
]

export async function getEndpointSpecs (path: string): Promise<EndpointSpecs | undefined> {
  const [ partA, partB ] = path.split('/')
  if (partA !== 'api' || partB == null || ignored.includes(partB)) return

  const name = inconsistentNameByEndpoint[partB] || partB
  let exports, directory
  if (standaloneEndpoint.includes(name)) {
    exports = await import(`#controllers/${name}`)
  } else {
    directory = differentDirectory[name] || name
    exports = await import(`#controllers/${directory}/${name}`)
  }
  if (exports.specs != null) {
    const specsName = inconsistentNameByEndpoint[exports.specs.name] || exports.specs.name
    if (specsName !== name) {
      throw newError("specs name doesn't match path name", 500, { name, specsName })
    }
    return exports.specs
  } else {
    warn(`specs not found: ${path}`)
  }
}
