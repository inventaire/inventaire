import _ from '#builders/utils'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { assert_ } from '#lib/utils/assert_types'
import { buildUrl } from '#lib/utils/url'
import { customAuthReq } from '#tests/api/utils/request'
import { waitForIndexation } from '#tests/api/utils/search'
import { getIndexedDoc } from './search.js'
import { publicReq, authReq, dataadminReq, adminReq, getDataadminUser, getUser } from './utils.js'

export const getByUris = (uris, relatives, refresh) => {
  uris = _.forceArray(uris)
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

export const getByUri = (uri, refresh) => {
  return getByUris(uri, null, refresh)
  .then(res => res.entities[uri])
}

export const findOrIndexEntities = async (uris, index = 'wikidata') => {
  const ids = _.map(uris, unprefixify)
  const results = await Promise.all(ids.map(id => getIndexedDoc(index, id)))
  const entitiesFound = _.filter(results, _.property('found'))
  const entitiesFoundUris = entitiesFound.map(_.property('_source.uri'))
  const entitiesNotFoundUris = _.difference(uris, entitiesFoundUris)
  if (_.isNonEmptyArray(entitiesNotFoundUris)) {
    // index entities into elasticsearch by getting the uris
    await getByUris(entitiesNotFoundUris)
    await Promise.all(ids.map(id => waitForIndexation('wikidata', id)))
  }
}

export const parseLabel = entity => Object.values(entity.labels)[0]

export const deleteByUris = uris => {
  uris = _.forceArray(uris)
  assert_.strings(uris)
  if (uris.length === 0) return
  return authReq('post', '/api/entities?action=delete', { uris })
}

export const getReverseClaims = async (property, value) => {
  const url = buildUrl('/api/entities', { action: 'reverse-claims', property, value })
  const { uris } = await publicReq('get', url)
  return uris
}

export const deleteByExternalId = async (property, externalId) => {
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

export const revertMerge = fromUri => {
  assert_.string(fromUri)
  fromUri = normalizeUri(fromUri)
  return dataadminReq('put', '/api/entities?action=revert-merge', { from: fromUri })
}

export const getHistory = entityId => {
  entityId = entityId.replace('inv:', '')
  return adminReq('get', `/api/entities?action=history&id=${entityId}`)
  .then(({ patches }) => patches)
}

export const updateLabel = ({ uri, lang, value, user }) => {
  user = user || getUser()
  uri = normalizeUri(uri)
  return customAuthReq(user, 'put', '/api/entities?action=update-label', { uri, lang, value })
}

export const updateClaim = ({ uri, property, oldValue, newValue, user }) => {
  uri = normalizeUri(uri)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=update-claim', {
    uri,
    property,
    'old-value': oldValue,
    'new-value': newValue,
  })
}

export const addClaim = ({ user, uri, property, value }) => {
  uri = normalizeUri(uri)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=add-claim', { uri, property, value })
}

export const removeClaim = ({ user, uri, property, value }) => {
  uri = normalizeUri(uri)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=remove-claim', { uri, property, value })
}

export const getRefreshedPopularityByUris = uris => {
  if (_.isArray(uris)) { uris = uris.join('|') }
  return publicReq('get', `/api/entities?action=popularity&uris=${uris}&refresh=true`)
}

export const getRefreshedPopularityByUri = uri => {
  return getRefreshedPopularityByUris(uri)
  .then(res => res.scores[uri])
}

export const revertEdit = async ({ patchId, user }) => {
  assert_.string(patchId)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=revert-edit', {
    patch: patchId,
  })
}

export const restoreVersion = async ({ patchId, user }) => {
  assert_.string(patchId)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/entities?action=restore-version', {
    patch: patchId,
  })
}

const normalizeUri = uri => _.isInvEntityId(uri) ? `inv:${uri}` : uri
