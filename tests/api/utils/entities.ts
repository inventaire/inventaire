import { difference, filter, map, property } from 'lodash-es'
import type { GetEntitiesByUrisResponse, GetEntitiesParams } from '#controllers/entities/by_uris_get'
import { unprefixify } from '#controllers/entities/lib/prefix'
import type { AwaitableUserWithCookie } from '#fixtures/users'
import { isInvEntityId, isNonEmptyArray } from '#lib/boolean_validations'
import { assertStrings, assertString } from '#lib/utils/assert_types'
import { forceArray, objectValues } from '#lib/utils/base'
import { buildUrl } from '#lib/utils/url'
import { federatedMode, localOrigin, remoteEntitiesOrigin } from '#server/config'
import { customAuthReq } from '#tests/api/utils/request'
import { waitForIndexation } from '#tests/api/utils/search'
import type { AbsoluteUrl, Url } from '#types/common'
import type { EntityUri, ExpandedSerializedEntitiesByUris, InvClaimValue, InvEntityId, PropertyUri, SerializedEntitiesByUris, SerializedEntity } from '#types/entity'
import type { PatchId } from '#types/patch'
import { getIndexedDoc } from './search.js'
import { publicReq, adminReq, getDataadminUser, getUser, getRemoteInstanceDataadmin } from './utils.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export function getByUris (uris: EntityUri[], relatives?: PropertyUri[], refresh?: boolean) {
  uris = forceArray(uris)
  assertStrings(uris)
  const url = buildUrl('/api/entities', {
    action: 'by-uris',
    uris: forceArray(uris).join('|'),
    relatives: relatives ? forceArray(relatives).join('|') : undefined,
    refresh,
  })
  return publicReq('get', url) as Promise<GetEntitiesByUrisResponse>
}

export async function getByUri (uri: EntityUri, refresh?: boolean) {
  const res = await getByUris([ uri ], null, refresh)
  return objectValues(res.entities)[0] as SerializedEntity
}

export async function getEntitiesAttributesByUris ({ uris, attributes, relatives, refresh }: Pick<GetEntitiesParams, 'uris' | 'attributes' | 'relatives' | 'refresh'>) {
  const expandedClaims = attributes.includes('references')
  const query = {
    action: 'by-uris',
    uris: forceArray(uris).join('|'),
    attributes: forceArray(attributes).join('|'),
    refresh,
    relatives: relatives ? forceArray(relatives).join('|') : undefined,
  }
  const { entities } = await publicReq('get', buildUrl('/api/entities', query))
  if (expandedClaims) {
    return entities as ExpandedSerializedEntitiesByUris
  } else {
    return entities as SerializedEntitiesByUris
  }
}

export async function getEntityAttributesByUri ({ uri, attributes }: { uri: EntityUri, attributes: GetEntitiesParams['attributes'] }) {
  const entities = await getEntitiesAttributesByUris({ uris: [ uri ], attributes })
  return entities[uri]
}

export async function findOrIndexEntities (uris: EntityUri[], index = 'wikidata') {
  const ids = map(uris, unprefixify)
  const results = await Promise.all(ids.map(id => getIndexedDoc(index, id)))
  const entitiesFound = filter(results, property('found'))
  const entitiesFoundUris: EntityUri[] = entitiesFound.map(property('_source.uri'))
  const entitiesNotFoundUris = difference(uris, entitiesFoundUris)
  if (isNonEmptyArray(entitiesNotFoundUris)) {
    // index entities into elasticsearch by getting the uris
    await getByUris(entitiesNotFoundUris)
    await Promise.all(ids.map(id => waitForIndexation('wikidata', id)))
  }
}

export const parseLabel = entity => Object.values(entity.labels)[0]

interface UserRequestOptions {
  user?: AwaitableUserWithCookie
  origin?: AbsoluteUrl
}

export function deleteByUris (uris: EntityUri[], options: UserRequestOptions = {}) {
  if (uris.length === 0) return
  const { url, user } = parseDataadminRequestOptions('/api/entities?action=delete', options)
  return customAuthReq(user, 'post', url, { uris })
}

export async function getReverseClaims (property: PropertyUri, value: InvClaimValue) {
  const url = buildUrl('/api/entities', { action: 'reverse-claims', property, value })
  const { uris } = await publicReq('get', url)
  return uris
}

export async function deleteByExternalId (property: PropertyUri, externalId: string) {
  const uris = await getReverseClaims(property, externalId)
  return deleteByUris(uris)
}

export function merge (fromUri: EntityUri, toUri: EntityUri, options: UserRequestOptions = {}) {
  assertString(fromUri)
  assertString(toUri)
  fromUri = normalizeUri(fromUri)
  toUri = normalizeUri(toUri)
  const { url, user } = parseDataadminRequestOptions('/api/entities?action=merge', options)
  return customAuthReq(user, 'put', url, { from: fromUri, to: toUri })
}

function parseDataadminRequestOptions (url: Url, options: UserRequestOptions) {
  const user = options.user || (federatedMode ? getRemoteInstanceDataadmin() : getDataadminUser())
  const origin = options.origin || (federatedMode ? remoteEntitiesOrigin : localOrigin)
  url = `${origin}${url}` as AbsoluteUrl
  return { url, user, origin }
}

export function revertMerge (fromUri: EntityUri, options: UserRequestOptions = {}) {
  assertString(fromUri)
  fromUri = normalizeUri(fromUri)
  const { url, user } = parseDataadminRequestOptions('/api/entities?action=revert-merge', options)
  return customAuthReq(user, 'put', url, { from: fromUri })
}

export async function getHistory (entityId: InvEntityId) {
  entityId = entityId.replace('inv:', '')
  const { patches } = await adminReq('get', `/api/entities?action=history&id=${entityId}`)
  return patches
}

export function updateLabel ({ uri, lang, value, user }: { uri: EntityUri, lang: WikimediaLanguageCode, value: string, user?: AwaitableUserWithCookie }) {
  user = user || getUser()
  uri = normalizeUri(uri)
  return customAuthReq(user, 'put', '/api/entities?action=update-label', { uri, lang, value })
}

export function removeLabel ({ uri, lang, user }: { uri: EntityUri, lang: WikimediaLanguageCode, user?: AwaitableUserWithCookie }) {
  user = user || getUser()
  uri = normalizeUri(uri)
  return customAuthReq(user, 'put', '/api/entities?action=remove-label', { uri, lang })
}

interface UpdateClaimParams {
  uri: EntityUri
  property: PropertyUri
  oldValue?: InvClaimValue
  newValue?: InvClaimValue
  user?: AwaitableUserWithCookie
  origin?: AbsoluteUrl
}
export function updateClaim ({ uri, property, oldValue, newValue, user, origin }: UpdateClaimParams) {
  uri = normalizeUri(uri)
  user ??= getUser()
  origin ??= localOrigin
  const body = { uri, property }
  if (oldValue) body['old-value'] = oldValue
  if (newValue) body['new-value'] = newValue
  return customAuthReq(user, 'put', `${origin}/api/entities?action=update-claim`, body)
}

export function addClaim ({ user, origin, uri, property, value }: Pick<UpdateClaimParams, 'user' | 'origin' | 'uri' | 'property'> & { value: UpdateClaimParams['newValue'] }) {
  return updateClaim({ user, origin, uri, property, newValue: value })
}

export function removeClaim ({ user, origin, uri, property, value }: Pick<UpdateClaimParams, 'user' | 'origin' | 'uri' | 'property'> & { value: UpdateClaimParams['oldValue'] }) {
  return updateClaim({ user, origin, uri, property, oldValue: value })
}

export function getRefreshedPopularityByUris (uris: EntityUri[]) {
  return publicReq('get', buildUrl('/api/entities', {
    action: 'popularity',
    uris: uris.join('|'),
    refresh: true,
  }))
}

export async function getRefreshedPopularityByUri (uri: EntityUri) {
  const { scores } = await getRefreshedPopularityByUris([ uri ])
  return scores[uri]
}

export async function revertEdit ({ patchId, user }: { patchId: PatchId, user?: AwaitableUserWithCookie }) {
  assertString(patchId)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=revert-edit', {
    patch: patchId,
  })
}

export async function restoreVersion ({ patchId, user }: { patchId: PatchId, user?: AwaitableUserWithCookie }) {
  assertString(patchId)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=restore-version', {
    patch: patchId,
  })
}

const normalizeUri = uri => isInvEntityId(uri) ? `inv:${uri}` : uri

export async function getAuthorWorks (uri: EntityUri) {
  const { works } = await publicReq('get', buildUrl('/api/entities', { action: 'author-works', uri }))
  const worksUris = map(works, 'uri')
  const { entities } = await getByUris(worksUris)
  return Object.values(entities)
}
