const CONFIG = require('config')
const __ = CONFIG.universalPath
const { buildSearcher } = __.require('lib', 'elasticsearch')

module.exports = buildSearcher({
  dbBaseName: 'items',
  queryBodyBuilder: (search, params) => {
    const { userId, limit = 10 } = params

    const must = [
      { term: { owner: userId } }
    ]

    const should = [
      { match: { 'snapshot.entity:title': search } },
      { match: { 'snapshot.entity:subtitle': search } },
      { match: { 'snapshot.entity:authors': search } },
      { match: { 'snapshot.entity:series': search } }
    ]

    const query = { bool: { must, should } }

    return { query, size: limit, min_score: 0.2 }
  }
})
