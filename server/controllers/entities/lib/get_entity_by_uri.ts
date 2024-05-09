import type { EntityUri } from '#types/entity'
import { getEntitiesByUris, type EntitiesGetterParams } from './get_entities_by_uris.js'

type GetEntityByUriArgs = Omit<EntitiesGetterParams, 'uris'> & { uri: EntityUri }

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
export async function getEntityByUri ({ uri, refresh, dry, includeReferences }: GetEntityByUriArgs) {
  const uris = [ uri ]
  const { entities } = await getEntitiesByUris({ uris, refresh, dry, includeReferences })
  return Object.values(entities)[0]
}
