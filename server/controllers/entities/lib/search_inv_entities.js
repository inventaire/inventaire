const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { buildSearcher } = __.require('lib', 'elasticsearch')

module.exports = buildSearcher({
  dbBaseName: 'entities',
  queryBodyBuilder: search => {
    const should = [
      { match: { _all: search } },
      { prefix: { _all: _.last(search.split(' ')) } }
    ]

    return { size: 20, query: { bool: { should } } }
  }
})
