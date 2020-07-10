const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { nonAuthReq } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { host: elasticHost } = CONFIG.elasticsearch
const assert_ = __.require('utils', 'assert_types')

const endpoint = '/api/search'

module.exports = {
  getIndexedDoc: async ({ indexBase, type = '_all', id }) => {
    assert_.string(indexBase)
    assert_.string(id)
    const index = CONFIG.db.name(indexBase)
    const url = `${elasticHost}/${index}/${type}/${id}`
    const res = await rawRequest('get', url)
    return JSON.parse(res.body)
  },

  search: ({ types, input, lang = 'en' }) => {
    if (_.isArray(types)) types = types.join('|')
    input = encodeURIComponent(input)
    return nonAuthReq('get', `${endpoint}?types=${types}&lang=${lang}&search=${input}`)
    .then(({ results }) => results)
  }
}
