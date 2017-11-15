CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataEntities = __.require 'data', 'wikidata/search_entities'
searchInvEntities = require './search_inv_entities'
{ search:searchDataseed } = __.require 'data', 'dataseed/dataseed'
{ searchTimeout } = CONFIG
{ enabled:dataseedEnabled } = CONFIG.dataseed
getEntitiesByUris = require './get_entities_by_uris'
GetEntitiesByUris = (refresh)-> (uris)-> getEntitiesByUris uris, refresh
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
randomString = __.require 'lib', './utils/random_string'

module.exports = (query)->
  _.type query, 'object'
  { disableDataseed, refresh } = query

  key = JSON.stringify(query) + ' ' + randomString(4)

  promises = [
    searchWikidataByText query, key
    searchInvByText query, key
  ]

  if dataseedEnabled and not disableDataseed
    promises.push searchDataseedByText(query, key)

  promises_.all promises
  .then mergeResults
  .then ReplaceEditionsByTheirWork(refresh)
  .then _.values
  .catch _.ErrorRethrow('search by text err')

searchWikidataByText = (query, key)->
  key = startTimer 'searchWikidataByText', key

  searchWikidataEntities query
  .timeout searchTimeout
  .map urifyWd
  # Starting to look for the entities as soon as we have a search result
  # as other search results might take more time here but less later
  .then GetEntitiesByUris(query.refresh)
  .then filterOutIrrelevantTypes
  .catch error_.notFound
  .finally _.EndTimer(key)

searchInvByText = (query, key)->
  { search } = query
  key = startTimer 'searchInvByText', key

  searchInvEntities search
  .timeout searchTimeout
  .map urifyInv
  .then GetEntitiesByUris(query.refresh)
  .catch error_.notFound
  .finally _.EndTimer(key)

searchDataseedByText = (query, key)->
  key = startTimer 'searchDataseedByText', key

  _.log query, 'query'
  { search, lang, refresh } = query
  # Get a list of matching ISBNs
  searchDataseed search, lang, refresh
  .timeout searchTimeout
  .get 'isbns'
  .map urifyIsbn
  # For which we now request the associated entities:
  # that's where the entity scaffolding from data seeds takes place
  .then GetEntitiesByUris(refresh)
  .catch error_.notFound
  .finally _.EndTimer(key)

urifyWd = (wdId)-> "wd:#{wdId}"
urifyIsbn = (isbn)-> "isbn:#{isbn}"
# It's ok to use the inv URI even if its not the canonical URI
# (wd and isbn URI are prefered) as getEntitiesByUris will
# take care of finding the right URI downward
urifyInv = (entity)-> "inv:#{entity._id}"

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

mergeResults = (results)->
  _.flattenIndexes _.compact(results).map(_.property('entities'))

ReplaceEditionsByTheirWork = (refresh)-> (entities)->
  missingWorkEntities = []
  for uri, entity of entities
    if entity.type is 'edition'
      workUri = entity.claims['wdt:P629']?[0]
      if workUri?
        # Ensure that the edition work is in the results
        unless entities[workUri]? then missingWorkEntities.push workUri
        # Remove the edition from the results as it will be fetched later
        # as an edition of its work
      else
        # Example: wd:Q24200032
        _.warn entity, 'edition without an associated work: ignored'
      delete entities[uri]

  missingWorkEntities = _.uniq missingWorkEntities
  _.log missingWorkEntities, 'missingWorkEntities from editions'

  return getEntitiesByUris missingWorkEntities, refresh
  .then (results)-> _.extend entities, results.entities

startTimer = (name, key)-> _.startTimer "#{name} #{key}"
