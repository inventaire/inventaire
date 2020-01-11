const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { nonAuthReq } = require('../utils/utils')
const { host: elasticHost } = CONFIG.elasticsearch
const { rawRequest } = require('./request')

const endpoint = '/api/search'

module.exports = {
  search: async (types, input, filter) => {
    if (_.isArray(types)) types = types.join('|')
    input = encodeURIComponent(input)
    let url = `${endpoint}?types=${types}&lang=en&search=${input}`
    if (filter) url += `&filter=${filter}`
    const { results } = await nonAuthReq('get', url)
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
