const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { publicReq, adminReq } = require('./utils')
const endpoint = '/api/tasks?action='

const utils = module.exports = {
  getByIds: ids => {
    ids = _.forceArray(ids).join('|')
    return publicReq('get', `${endpoint}by-ids&ids=${ids}`)
    .then(({ tasks }) => tasks)
  },

  getBySuspectUris: uris => {
    uris = _.forceArray(uris).join('|')
    return publicReq('get', `${endpoint}by-suspect-uris&uris=${uris}`)
    .then(({ tasks }) => tasks)
  },

  getBySuspectUri: uri => {
    return utils.getBySuspectUris(uri)
    .then(obj => obj[uri])
  },

  getBySuggestionUris: uris => {
    uris = _.forceArray(uris).join('|')
    return publicReq('get', `${endpoint}by-suggestion-uris&uris=${uris}`)
    .then(({ tasks }) => tasks)
  },

  getByScore: (options = {}) => {
    let url = `${endpoint}by-score`
    const { limit, offset } = options
    if (limit != null) url += `&limit=${limit}`
    if (offset != null) url += `&offset=${offset}`
    return publicReq('get', url)
    .then(({ tasks }) => tasks)
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
}
