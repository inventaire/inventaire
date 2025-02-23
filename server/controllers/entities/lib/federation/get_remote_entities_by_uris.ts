import { compact, partition, values, zip } from 'lodash-es'
import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import type { GetEntitiesByUrisParams } from '#controllers/entities/lib/get_entities_by_uris'
import type { GetEntityByUriArgs } from '#controllers/entities/lib/get_entity_by_uri'
import type { ReverseClaimsParams } from '#controllers/entities/lib/reverse_claims'
import type { GetReverseClaimsResponse } from '#controllers/entities/reverse_claims'
import { cache_ } from '#lib/cache'
import { federatedRequest } from '#lib/federation/federated_requests'
import { radio } from '#lib/radio'
import { objectFromEntries } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { buildUrl } from '#lib/utils/url'
import type { EntityUri, SerializedEntitiesByUris, SerializedEntity } from '#types/entity'

export async function getRemoteEntitiesByUris ({ uris, refresh }: Pick<GetEntitiesByUrisParams, 'uris' | 'refresh'>) {
  uris = compact(uris)
  if (uris.length === 0) return { entities: {}, redirects: {} } satisfies GetEntitiesByUrisResponse

  let notCachedUris: EntityUri[]
  let cachedEntities: SerializedEntitiesByUris
  if (refresh) {
    notCachedUris = uris
    cachedEntities = {}
  } else {
    const cacheKeys = uris.map(getCacheKey)
    const cachedValues = await cache_.dryGetMany(cacheKeys)
    const parsedCachedValues = cachedValues.map(stringifiedValue => stringifiedValue != null ? JSON.parse(stringifiedValue) : null)
    const uriAndEntityEntries = zip(uris, parsedCachedValues)
    const [ cached, notCached ] = partition(uriAndEntityEntries, ([ , cachedValue ]) => cachedValue != null)
    cachedEntities = objectFromEntries(cached) as SerializedEntitiesByUris
    notCachedUris = notCached.map(entry => entry[0])
  }

  if (notCachedUris.length > 0) {
    const remoteUrl = buildUrl('/api/entities', { action: 'by-uris', uris: notCachedUris.join('|') })
    const res = await federatedRequest<GetEntitiesByUrisResponse>('get', remoteUrl)

    const cacheBatch = values(res.entities).map(entity => ({ type: 'put', key: getCacheKey(entity.uri), value: JSON.stringify(entity) }))
    await cache_.batch(cacheBatch)
    Object.assign(res.entities, cachedEntities)
    return res
  } else {
    return { entities: cachedEntities, redirects: {} } satisfies GetEntitiesByUrisResponse
  }
}

const getCacheKey = (uri: EntityUri) => `remote:entity:${uri}`

export async function getRemoteEntitiesList (uris: EntityUri[], params: Partial<Pick<GetEntitiesByUrisParams, 'refresh'>> = {}) {
  uris = compact(uris)
  if (uris.length === 0) return [] as SerializedEntity[]
  const { entities } = await getRemoteEntitiesByUris({ uris, ...params })
  return Object.values(entities)
}

export async function getRemoteEntityByUri ({ uri, refresh }: GetEntityByUriArgs) {
  const [ entity ] = await getRemoteEntitiesList([ uri ], { refresh })
  return entity
}

export async function getRemoteReverseClaims (params: ReverseClaimsParams) {
  const remoteUrl = buildUrl('/api/entities', { action: 'reverse-claims', ...params })
  const { uris } = await federatedRequest<GetReverseClaimsResponse>('get', remoteUrl)
  return uris
}

radio.on('entity:changed', async uri => {
  try {
    await cache_.delete(getCacheKey(uri))
    info(`remote entity cache invalidation: ${uri}`)
  } catch (err) {
    logError(err, 'remote entity cache invalidation error')
  }
})
