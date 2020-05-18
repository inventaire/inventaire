const CONFIG = require('config')
const __ = CONFIG.universalPath
const { buildSearcher } = __.require('lib', 'elasticsearch')

module.exports = buildSearcher({
  dbBaseName: 'items',
  queryBodyBuilder: (search, params) => {
    const { userId, limit = 20 } = params

    const must = [
      { match: { owner: userId } }
    ]

    const should = []

    return { size: limit, query: { bool: { must, should } } }
  }
})
