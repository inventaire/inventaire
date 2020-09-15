const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const { publicReq, authReq, dataadminReq, adminReq } = require('./utils')

const entitiesUtils = module.exports = {
  getByUris: (uris, relatives) => {
    uris = _.forceArray(uris)
    assert_.strings(uris)
    uris = uris.join('|')
    const url = _.buildPath('/api/entities', { action: 'by-uris', uris, relatives })
    return publicReq('get', url)
  },

  getByUri: uri => {
    return entitiesUtils.getByUris(uri)
    .then(res => res.entities[uri])
  },

  parseLabel: entity => Object.values(entity.labels)[0],

  deleteByUris: uris => {
    uris = _.forceArray(uris)
    assert_.strings(uris)
    return adminReq('post', '/api/entities?action=delete-by-uris', { uris })
  },

  merge: (fromUri, toUri) => {
    assert_.string(fromUri)
    assert_.string(toUri)
    fromUri = normalizeUri(fromUri)
    toUri = normalizeUri(toUri)
    return adminReq('put', '/api/entities?action=merge', { from: fromUri, to: toUri })
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
