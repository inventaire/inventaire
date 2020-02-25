const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { nonAuthReq } = require('../utils/utils')

const endpoint = '/api/search'

module.exports = {
  search: ({ types, input, lang = 'en' }) => {
    if (_.isArray(types)) types = types.join('|')
    input = encodeURIComponent(input)
    return nonAuthReq('get', `${endpoint}?types=${types}&lang=${lang}&search=${input}`)
    .then(({ results }) => results)
  }
}
