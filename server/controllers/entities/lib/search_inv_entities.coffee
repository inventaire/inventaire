# Same as ./search_type.coffee but only for inventaire entities
# instead of both wikidata and inventaire
CONFIG = require 'config'
__ = require('config').universalPath
{ buildSearcher } = __.require 'lib', 'elasticsearch'

module.exports = buildSearcher
  dbBaseName: 'entities'
  queryBodyBuilder: require './common_query_body_builder'
