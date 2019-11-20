
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let utils
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { nonAuthReq, adminReq } = require('./utils')
const endpoint = '/api/tasks?action='

module.exports = (utils = {
  getByIds: ids => {
    ids = _.forceArray(ids).join('|')
    return nonAuthReq('get', `${endpoint}by-ids&ids=${ids}`)
    .get('tasks')
  },

  getBySuspectUris: uris => {
    uris = _.forceArray(uris).join('|')
    return nonAuthReq('get', `${endpoint}by-suspect-uris&uris=${uris}`)
    .get('tasks')
  },

  getBySuspectUri: uri => {
    return utils.getBySuspectUris(uri)
    .get(uri)
  },

  getBySuggestionUris: uris => {
    uris = _.forceArray(uris).join('|')
    return nonAuthReq('get', `${endpoint}by-suggestion-uris&uris=${uris}`)
    .get('tasks')
  },

  getByScore: (options = {}) => {
    let url = `${endpoint}by-score`
    const { limit, offset } = options
    if (limit != null) { url += `&limit=${limit}` }
    if (offset != null) { url += `&offset=${offset}` }
    return nonAuthReq('get', url)
    .get('tasks')
  },

  update: (id, attribute, value) => {
    return adminReq('put', `${endpoint}update`, { id, attribute, value })
  },

  checkEntities: uris => {
    uris = _.forceArray(uris)
    return adminReq('post', `${endpoint}check-entities`, { uris })
    .then(() => utils.getBySuspectUris(uris))
    .then(tasksBySuspectUris => _.flatten(_.values(tasksBySuspectUris)))
  },

  collectEntities: () => adminReq('post', `${endpoint}collect-entities`)
})
