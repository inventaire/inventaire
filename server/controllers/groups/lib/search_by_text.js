const CONFIG = require('config')
const __ = CONFIG.universalPath
const { buildSearcher } = __.require('lib', 'elasticsearch')

module.exports = buildSearcher({
  dbBaseName: 'groups',
  queryBodyBuilder: search => {
    const should = [
      // Name
      { match: { name: { query: search, boost: 5 } } },
      { match_phrase_prefix: { name: { query: search, boost: 4 } } },
      { fuzzy: { name: search } },
      // Description
      { match: { description: search } }
    ]

    return { query: { bool: { should } } }
  }
})
