import { difference, filter, isArray, map, property } from 'lodash-es'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { isInvEntityId, isNonEmptyArray } from '#lib/boolean_validations'
import { assert_ } from '#lib/utils/assert_types'
import { forceArray } from '#lib/utils/base'
import { buildUrl } from '#lib/utils/url'
import { customAuthReq } from '#tests/api/utils/request'
import { waitForIndexation } from '#tests/api/utils/search'
import { getIndexedDoc } from './search.js'
import { publicReq, authReq, dataadminReq, adminReq, getDataadminUser, getUser } from './utils.js'

export function getByUris (uris, relatives, refresh) {
  uris = forceArray(uris)
  assert_.strings(uris)
  uris = uris.join('|')
  const url = buildUrl('/api/entities', {
    action: 'by-uris',
    uris,
    relatives,
    refresh,
  })
  return publicReq('get', url)
}

export async function getByUri (uri, refresh) {
  const res = await getByUris(uri, null, refresh)
  return Object.values(res.entities)[0]
}

export async function getEntitiesAttributesByUris ({ uris, attributes, relatives, refresh }) {
  const query = {
    action: 'by-uris',
    uris: forceArray(uris).join('|'),
    attributes: forceArray(attributes).join('|'),
    refresh,
  }
  if (relatives) query.relatives = forceArray(relatives).join('|')
  const { entities } = await publicReq('get', buildUrl('/api/entities', query))
  return entities
}

export const findOrIndexEntities = async (uris, index = 'wikidata') => {
  const ids = map(uris, unprefixify)
  const results = await Promise.all(ids.map(id => getIndexedDoc(index, id)))
  const entitiesFound = filter(results, property('found'))
  const entitiesFoundUris = entitiesFound.map(property('_source.uri'))
  const entitiesNotFoundUris = difference(uris, entitiesFoundUris)
  if (isNonEmptyArray(entitiesNotFoundUris)) {
    // index entities into elasticsearch by getting the uris
    await getByUris(entitiesNotFoundUris)
    await Promise.all(ids.map(id => waitForIndexation('wikidata', id)))
  }
}

export const parseLabel = entity => Object.values(entity.labels)[0]

export function deleteByUris (uris) {
  uris = forceArray(uris)
  assert_.strings(uris)
  if (uris.length === 0) return
  return authReq('post', '/api/entities?action=delete', { uris })
}

export async function getReverseClaims (property, value) {
  const url = buildUrl('/api/entities', { action: 'reverse-claims', property, value })
  const { uris } = await publicReq('get', url)
  return uris
}

export async function deleteByExternalId (property, externalId) {
  const uris = await getReverseClaims(property, externalId)
  return deleteByUris(uris)
}

export const merge = (fromUri, toUri, options = {}) => {
  assert_.string(fromUri)
  assert_.string(toUri)
  fromUri = normalizeUri(fromUri)
  toUri = normalizeUri(toUri)
  const user = options.user || getDataadminUser()
  return customAuthReq(user, 'put', '/api/entities?action=merge', { from: fromUri, to: toUri })
}

export function revertMerge (fromUri) {
  assert_.string(fromUri)
  fromUri = normalizeUri(fromUri)
  return dataadminReq('put', '/api/entities?action=revert-merge', { from: fromUri })
}

export function getHistory (entityId) {
  entityId = entityId.replace('inv:', '')
  return adminReq('get', `/api/entities?action=history&id=${entityId}`)
  .then(({ patches }) => patches)
}

export function updateLabel ({ uri, lang, value, user }) {
  user = user || getUser()
  uri = normalizeUri(uri)
  return customAuthReq(user, 'put', '/api/entities?action=update-label', { uri, lang, value })
}

export function removeLabel ({ uri, lang, user }) {
  user = user || getUser()
  uri = normalizeUri(uri)
  return customAuthReq(user, 'put', '/api/entities?action=remove-label', { uri, lang })
}

export function updateClaim ({ uri, property, oldValue, newValue, user }) {
  uri = normalizeUri(uri)
  user = user || getUser()
  const body = { uri, property }
  if (oldValue) body['old-value'] = oldValue
  if (newValue) body['new-value'] = newValue
  return customAuthReq(user, 'put', '/api/entities?action=update-claim', body)
}

export function addClaim ({ user, uri, property, value }) {
  return updateClaim({ user, uri, property, newValue: value })
}

export function removeClaim ({ user, uri, property, value }) {
  return updateClaim({ user, uri, property, oldValue: value })
}

export function getRefreshedPopularityByUris (uris) {
  if (isArray(uris)) { uris = uris.join('|') }
  return publicReq('get', `/api/entities?action=popularity&uris=${uris}&refresh=true`)
}

export function getRefreshedPopularityByUri (uri) {
  return getRefreshedPopularityByUris(uri)
  .then(res => res.scores[uri])
}

export async function revertEdit ({ patchId, user }) {
  assert_.string(patchId)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=revert-edit', {
    patch: patchId,
  })
}

export async function restoreVersion ({ patchId, user }) {
  assert_.string(patchId)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=restore-version', {
    patch: patchId,
  })
}

const normalizeUri = uri => isInvEntityId(uri) ? `inv:${uri}` : uri
