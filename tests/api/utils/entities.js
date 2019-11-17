// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let entitiesUtils
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { nonAuthReq, authReq, adminReq } = require('./utils')

module.exports = (entitiesUtils = {
  getByUris: (uris, relatives) => {
    if (_.isArray(uris)) { uris = uris.join('|') }
    const url = _.buildPath('/api/entities', { action: 'by-uris', uris, relatives })
    return nonAuthReq('get', url)
  },

  getByUri: uri => {
    return entitiesUtils.getByUris(uri)
    .then(res => res.entities[uri])
  },

  deleteByUris: uris => {
    uris = _.forceArray(uris)
    return adminReq('post', '/api/entities?action=delete-by-uris', { uris })
  },

  merge: (fromUri, toUri) => {
    fromUri = normalizeUri(fromUri)
    toUri = normalizeUri(toUri)
    return adminReq('put', '/api/entities?action=merge', { from: fromUri, to: toUri })
  },

  revertMerge: fromUri => {
    fromUri = normalizeUri(fromUri)
    return adminReq('put', '/api/entities?action=revert-merge', { from: fromUri })
  },

  getHistory: entityId => {
    entityId = entityId.replace('inv:', '')
    return nonAuthReq('get', `/api/entities?action=history&id=${entityId}`)
    .get('patches')
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
    return nonAuthReq('get', `/api/entities?action=popularity&uris=${uris}&refresh=true`)
  },

  getRefreshedPopularityByUri: uri => {
    return entitiesUtils.getRefreshedPopularityByUris(uri)
    .then(res => res.scores[uri])
  }
})

const normalizeUri = uri => _.isInvEntityId(uri) ? `inv:${uri}` : uri
