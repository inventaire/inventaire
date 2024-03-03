import type { EntityUri } from '#types/entity'
import { getEntitiesByUris } from './get_entities_by_uris.js'

interface GetEntityByUriArgs {
  uri: EntityUri
  refresh?: boolean
  dry?: boolean
}

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
export async function getEntityByUri ({ uri, refresh, dry }: GetEntityByUriArgs) {
  const uris = [ uri ]
  const { entities } = await getEntitiesByUris({ uris, refresh, dry })
  return Object.values(entities)[0]
}
