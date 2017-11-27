CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataByText = __.require 'data', 'wikidata/search_by_text'
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

urifyIsbn = (isbn)-> "isbn:#{isbn}"
# It's ok to use the inv URI even if its not the canonical URI
# (wd and isbn URI are prefered) as getEntitiesByUris will
# take care of finding the right URI downward
urifyInv = (entity)-> "inv:#{entity._id}"

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
