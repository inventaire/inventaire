CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

searchWikidataEntities = __.require 'data', 'wikidata/search_entities'

getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
GetEntitiesByUris = (refresh)-> (uris)-> getEntitiesByUris uris, refresh

{ searchTimeout } = CONFIG

module.exports = (query, key)->
  key = startTimer 'searchWikidataByText', key

  searchWikidataEntities query
  .timeout searchTimeout
  .map urifyWd
  # Starting to look for the entities as soon as we have a search result
  # as other search results might take more time here but less later
  .then GetEntitiesByUris(query)
  .then filterOutIrrelevantTypes
  .catch error_.notFound
  .finally _.EndTimer(key)

urifyWd = (wdId)-> "wd:#{wdId}"

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

startTimer = (name, key)-> _.startTimer "#{name} #{key}"
