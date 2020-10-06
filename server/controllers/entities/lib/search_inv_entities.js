const CONFIG = require('config')
const __ = CONFIG.universalPath
const { buildSearcher } = __.require('lib', 'elasticsearch')
const queryBuilder = __.require('controllers', 'search/lib/entities_query_builder')

module.exports = buildSearcher({
  dbBaseName: 'entities',
  queryBuilder
})
