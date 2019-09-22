CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataByText = __.require 'data', 'wikidata/search_by_text'
searchInvEntities = require './search_inv_entities'
getEntitiesByUris = require './get_entities_by_uris'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
{ getInvEntityUri } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (query)->
  assert_.object query
  { refresh } = query

  promises_.all [
    searchWikidataByText query
    searchInvByText query
  ]
  .then mergeResults
  .then replaceEditionsByTheirWork(refresh)
  .then _.values
  .catch _.ErrorRethrow('search by text err')

searchInvByText = (query, key)->
  { search } = query

  searchInvEntities search
  # It's ok to use the inv URI even if its not the canonical URI
  # (wd and isbn URI are prefered) as getEntitiesByUris will
  # take care of finding the right URI downward
  .map getInvEntityUri
  .then (uris)-> getEntitiesByUris { uris }
  .catch error_.notFound

mergeResults = (results)->
  _.flattenIndexes _.compact(results).map(_.property('entities'))

replaceEditionsByTheirWork = (refresh)-> (entities)->
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

  return getEntitiesByUris { uris: missingWorkEntities, refresh }
  .then (results)-> _.extend entities, results.entities
