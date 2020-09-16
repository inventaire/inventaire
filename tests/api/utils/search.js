const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { publicReq } = require('../utils/utils')
const { host: elasticHost } = CONFIG.elasticsearch
const { rawRequest } = require('./request')

const endpoint = '/api/search'

module.exports = {
  search: async (types, input, lang = 'en') => {
    if (_.isArray(types)) types = types.join('|')
    input = encodeURIComponent(input)
    const { results } = await publicReq('get', `${endpoint}?types=${types}&lang=${lang}&search=${input}`)
    return results
  },

  checkIndexation: async (index, type, id) => {
    try {
      const { body } = await rawRequest('get', `${elasticHost}/${index}/${type}/${id}`)
      return JSON.parse(body)
    } catch (err) {
      if (err.statusCode === 404) {
        return JSON.parse(err.context.resBody)
      } else {
        throw err
      }
    }
  }
}
