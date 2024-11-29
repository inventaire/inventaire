import { assert_ } from '#lib/utils/assert_types'
import type { EntityUri } from '#types/entity'
import { getEntitiesByUris, getExpandedEntitiesByUris, type EntitiesGetterParams } from './get_entities_by_uris.js'

type GetEntityByUriArgs = Omit<EntitiesGetterParams, 'uris' | 'includeReferences'> & { uri: EntityUri }

// Get only the entity formatted doc you needs instead of an object
// with entities and redirects
export async function getEntityByUri ({ uri, refresh, dry }: GetEntityByUriArgs) {
  assert_.string(uri)
  const uris = [ uri ]
  const { entities } = await getEntitiesByUris({ uris, refresh, dry })
  return Object.values(entities)[0]
}

export async function getExpandedEntityByUri ({ uri, refresh, dry }: GetEntityByUriArgs) {
  assert_.string(uri)
  const uris = [ uri ]
  const { entities } = await getExpandedEntitiesByUris({ uris, refresh, dry })
  return Object.values(entities)[0]
}
