import _ from 'builders/utils'
import assert_ from 'lib/utils/assert_types'

import {
  publicReq,
  authReq,
  dataadminReq,
  adminReq,
  customAuthReq,
  getDataadminUser,
  getUser,
} from './utils'

import { getIndexedDoc } from '../utils/search'
import { unprefixify } from 'controllers/entities/lib/prefix'
import { waitForIndexation } from 'tests/api/utils/search'
import { buildUrl } from 'lib/utils/url'

const entitiesUtils = {
  getByUris: (uris, relatives, refresh) => {
    uris = _.forceArray(uris)
    assert_.strings(uris)
    uris = uris.join('|')
    const url = buildUrl('/api/entities', {
      action: 'by-uris',
      uris,
      relatives,
      refresh
    })
    return publicReq('get', url)
  },

  getByUri: (uri, refresh) => {
    return entitiesUtils.getByUris(uri, null, refresh)
    .then(res => res.entities[uri])
  },

  findOrIndexEntities: async (uris, index = 'wikidata') => {
    const ids = _.map(uris, unprefixify)
    const results = await Promise.all(ids.map(id => getIndexedDoc(index, id)))
    const entitiesFound = _.filter(results, _.property('found'))
    const entitiesFoundUris = entitiesFound.map(_.property('_source.uri'))
    const entitiesNotFoundUris = _.difference(uris, entitiesFoundUris)
    if (_.isNonEmptyArray(entitiesNotFoundUris)) {
      // index entities into elasticsearch by getting the uris
      await entitiesUtils.getByUris(entitiesNotFoundUris)
      await Promise.all(ids.map(id => waitForIndexation('wikidata', id)))
    }
  },

  parseLabel: entity => Object.values(entity.labels)[0],

  deleteByUris: uris => {
    uris = _.forceArray(uris)
    assert_.strings(uris)
    if (uris.length === 0) return
    return authReq('post', '/api/entities?action=delete', { uris })
  },

  getReverseClaims: async (property, value) => {
    const url = buildUrl('/api/entities', { action: 'reverse-claims', property, value })
    const { uris } = await publicReq('get', url)
    return uris
  },

  deleteByExternalId: async (property, externalId) => {
    const uris = await entitiesUtils.getReverseClaims(property, externalId)
    return entitiesUtils.deleteByUris(uris)
  },

  merge: (fromUri, toUri, options = {}) => {
    assert_.string(fromUri)
    assert_.string(toUri)
    fromUri = normalizeUri(fromUri)
    toUri = normalizeUri(toUri)
    const user = options.user || getDataadminUser()
    return customAuthReq(user, 'put', '/api/entities?action=merge', { from: fromUri, to: toUri })
  },

  revertMerge: fromUri => {
    assert_.string(fromUri)
    fromUri = normalizeUri(fromUri)
    return dataadminReq('put', '/api/entities?action=revert-merge', { from: fromUri })
  },

  getHistory: entityId => {
    entityId = entityId.replace('inv:', '')
    return adminReq('get', `/api/entities?action=history&id=${entityId}`)
    .then(({ patches }) => patches)
  },

  updateLabel: ({ uri, lang, value, user }) => {
    user = user || getUser()
    uri = normalizeUri(uri)
    return customAuthReq(user, 'put', '/api/entities?action=update-label', { uri, lang, value })
  },

  updateClaim: ({ uri, property, oldValue, newValue, user }) => {
    uri = normalizeUri(uri)
    user = user || getUser()
    const body = { uri, property }
    if (oldValue) body['old-value'] = oldValue
    if (newValue) body['new-value'] = newValue
    return customAuthReq(user, 'put', '/api/entities?action=update-claim', body)
  },

  addClaim: ({ user, uri, property, value }) => {
    return entitiesUtils.updateClaim({ user, uri, property, newValue: value })
  },
  removeClaim: ({ user, uri, property, value }) => {
    return entitiesUtils.updateClaim({ user, uri, property, oldValue: value })
  },

  getRefreshedPopularityByUris: uris => {
    if (_.isArray(uris)) { uris = uris.join('|') }
    return publicReq('get', `/api/entities?action=popularity&uris=${uris}&refresh=true`)
  },

  getRefreshedPopularityByUri: uri => {
    return entitiesUtils.getRefreshedPopularityByUris(uri)
    .then(res => res.scores[uri])
  },

  revertEdit: async ({ patchId, user }) => {
    assert_.string(patchId)
    user = user || getUser()
    return customAuthReq(user, 'put', '/api/entities?action=revert-edit', {
      patch: patchId
    })
  },

  restoreVersion: async ({ patchId, user }) => {
    assert_.string(patchId)
    user = user || getUser()
    return customAuthReq(user, 'put', '/api/entities?action=restore-version', {
      patch: patchId
    })
  },
}

export default entitiesUtils

const normalizeUri = uri => _.isInvEntityId(uri) ? `inv:${uri}` : uri
