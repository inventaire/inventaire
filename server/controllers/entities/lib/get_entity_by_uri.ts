import type { EntityUri } from '#types/entity'
import { getEntitiesByUris, getExtendedEntitiesByUris, type EntitiesGetterParams } from './get_entities_by_uris.js'

type GetEntityByUriArgs = Omit<EntitiesGetterParams, 'uris' | 'includeReferences'> & { uri: EntityUri }

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
export async function getEntityByUri ({ uri, refresh, dry }: GetEntityByUriArgs) {
  const uris = [ uri ]
  const { entities } = await getEntitiesByUris({ uris, refresh, dry })
  return Object.values(entities)[0]
}

export async function getExtendedEntityByUri ({ uri, refresh, dry }: GetEntityByUriArgs) {
  const uris = [ uri ]
  const { entities } = await getExtendedEntitiesByUris({ uris, refresh, dry })
  return Object.values(entities)[0]
}
