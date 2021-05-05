const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const { publicReq, authReq, dataadminReq, adminReq, customAuthReq, getDataadminUser } = require('./utils')
const { getIndexedDoc } = require('../utils/search')
const { unprefixify } = require('controllers/entities/lib/prefix')
const { waitForIndexation } = require('tests/api/utils/search')

const entitiesUtils = module.exports = {
  getByUris: (uris, relatives, refresh) => {
    uris = _.forceArray(uris)
    assert_.strings(uris)
    uris = uris.join('|')
    const url = _.buildPath('/api/entities', {
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
    const results = await Promise.all(ids.map(entitiesUtils.getElasticEntity(index)))
    const entitiesFound = _.filter(results, _.property('found'))
    const entitiesFoundUris = entitiesFound.map(_.property('_source.uri'))
    const entitiesNotFoundUris = _.difference(uris, entitiesFoundUris)
    if (_.isNonEmptyArray(entitiesNotFoundUris)) {
      // index entities into elasticsearch by getting the uris
      await entitiesUtils.getByUris(entitiesNotFoundUris)
      await Promise.all(ids.map(id => waitForIndexation('wikidata', id)))
    }
  },

  getElasticEntity: index => id => getIndexedDoc(index, 'humans', id),

  parseLabel: entity => Object.values(entity.labels)[0],

  deleteByUris: uris => {
    uris = _.forceArray(uris)
    assert_.strings(uris)
    return authReq('post', '/api/entities?action=delete', { uris })
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

  updateLabel: (uri, lang, value) => {
    uri = normalizeUri(uri)
    return authReq('put', '/api/entities?action=update-label', { uri, lang, value })
  },

  updateClaim: (uri, property, oldValue, newValue) => {
    uri = normalizeUri(uri)
    const body = { uri, property }
    if (oldValue) body['old-value'] = oldValue
    if (newValue) body['new-value'] = newValue
    return authReq('put', '/api/entities?action=update-claim', body)
  },

  addClaim: (uri, property, value) => entitiesUtils.updateClaim(uri, property, null, value),
  removeClaim: (uri, property, value) => entitiesUtils.updateClaim(uri, property, value, null),

  getRefreshedPopularityByUris: uris => {
    if (_.isArray(uris)) { uris = uris.join('|') }
    return publicReq('get', `/api/entities?action=popularity&uris=${uris}&refresh=true`)
  },

  getRefreshedPopularityByUri: uri => {
    return entitiesUtils.getRefreshedPopularityByUris(uri)
    .then(res => res.scores[uri])
  },

  revertEdit: patchId => {
    assert_.string(patchId)
    return authReq('put', '/api/entities?action=revert-edit', { patch: patchId })
  }
}

const normalizeUri = uri => _.isInvEntityId(uri) ? `inv:${uri}` : uri
