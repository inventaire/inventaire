__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
{ parse:parseIsbn, normalizeIsbn } = __.require 'lib', 'isbn/isbn'
dataseed = __.require 'data', 'dataseed/dataseed'
scaffoldEditionEntityFromSeed = require './scaffold_entity_from_seed/edition'
formatEditionEntity = require './format_edition_entity'
isbn_ = __.require 'lib', 'isbn/isbn'
{ prefixifyIsbn } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (rawIsbns, refresh)->
  [ isbns, redirections ] = getRedirections rawIsbns
  # search entities by isbn locally
  entities_.byIsbns isbns
  .then (entities)->
    foundIsbns = entities.map getIsbn13h
    _.log foundIsbns, 'foundIsbns'
    missingIsbns = _.difference isbns, foundIsbns
    _.log missingIsbns, 'missingIsbns'

    entities = entities.map formatEditionEntity

    if missingIsbns.length is 0
      results = { entities }
      return addRedirections results, redirections

    # then look for missing isbns on dataseed
    getMissingEditionEntitiesFromSeeds missingIsbns, refresh
    .spread (newEntities, notFound)->
      results = { entities: entities.concat(newEntities) }

      if notFound.length > 0
        results.notFound = _.map(notFound, 'isbn').map prefixifyIsbn

      return addRedirections results, redirections

getIsbn13h = (entity)-> entity.claims['wdt:P212'][0]

getMissingEditionEntitiesFromSeeds = (isbns, refresh)->
  dataseed.getByIsbns isbns, refresh
  .then (seeds)->
    insufficientData = []
    validSeeds = []
    # TODO: Filter out more aggressively bad quality seeds
    # - titles with punctuations
    # - authors with punctuations or single word
    for seed in seeds
      if _.isNonEmptyString seed.title then validSeeds.push seed
      else insufficientData.push seed

    promises_.all validSeeds.map(scaffoldEditionEntityFromSeed)
    .map formatEditionEntity
    .then (newEntities)-> [ newEntities, insufficientData ]

getRedirections = (isbns)->
  # isbns list, redirections object
  accumulator = [ [], {} ]
  return isbns.reduce aggregateIsbnRedirections, accumulator

# Redirection mechanism is coupled with the way
# ./get_entities_by_uris 'mergeResponses' parses redirections
aggregateIsbnRedirections = (accumulator, rawIsbn)->
  { isbn13:uriIsbn, isbn13h:claimIsbn } = isbn_.parse rawIsbn
  rawUri = "isbn:#{rawIsbn}"
  uri = "isbn:#{uriIsbn}"
  accumulator[0].push claimIsbn
  if rawUri isnt uri then accumulator[1][uri] = { from: rawUri, to: uri }
  return accumulator

addRedirections = (results, redirections)->
  results.entities = results.entities.map (entity)->
    { uri } = entity
    redirects = redirections[uri]
    if redirects? then entity.redirects = redirects
    return entity

  return results
