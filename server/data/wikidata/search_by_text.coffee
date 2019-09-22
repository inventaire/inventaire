CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

searchWikidataEntities = __.require 'data', 'wikidata/search_entities'
{ prefixifyWd } = __.require 'controllers', 'entities/lib/prefix'
getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'

{ searchTimeout } = CONFIG

module.exports = (query)->
  { search, refresh } = query
  searchWikidataEntities { search, refresh }
  .timeout searchTimeout
  .map prefixifyWd
  .then (uris)-> getEntitiesByUris { uris, refresh }
  .then filterOutIrrelevantTypes
  .catch error_.notFound

filterOutIrrelevantTypes = (result)->
  for uri, entity of result.entities
    { type } = entity
    notTypeFound = not type?
    if notTypeFound then _.warn "not relevant type found, filtered out: #{uri}"
    # /!\ At this point, entities given the type meta will look something like
    # { id: 'Q9232060', uri: 'wd:Q9232060', type: 'meta' }
    # Thus, you can't assume that entity.labels? or entity.claims? is true
    if notTypeFound or type is 'meta' then delete result.entities[uri]

  return result
