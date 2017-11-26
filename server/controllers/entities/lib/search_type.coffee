CONFIG = require 'config'
__ = CONFIG.universalPath
{ buildSearcher } = __.require 'lib', 'elasticsearch'

invEntitiesIndex = CONFIG.db.name 'entities'
index = "wikidata,#{invEntitiesIndex}"

queryBodyBuilder = require './common_query_body_builder'

module.exports = buildSearcher { index, queryBodyBuilder }
