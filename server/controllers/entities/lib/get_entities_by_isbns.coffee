__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
{ parse:parseIsbn, normalizeIsbn } = __.require 'lib', 'isbn/isbn'
dataseed = __.require 'data', 'dataseed/dataseed'
scaffoldEntityFromSeed = require './scaffold_entity_from_seed'

module.exports = (isbns, refresh)->
  # search entities by isbn locally
  entities_.byIsbns isbns
  .then (entities)->
    foundIsbns = entities.map getNormalizedIsbn
    _.log foundIsbns, 'foundIsbns'
    missingIsbns = _.difference isbns, foundIsbns
    _.log missingIsbns, 'missingIsbns'

    entities = entities.map formatEntity

    if missingIsbns.length is 0 then return { entities }

    # then look for missing isbns on dataseed
    getMissingEntitiesFromSeeds missingIsbns, refresh
    .spread (newEntities, notFound)->
      data =
        entities: entities.concat newEntities

      if notFound.length > 0 then data.notFound = notFound

      return data

getNormalizedIsbn = (entity)-> normalizeIsbn entity.claims['wdt:P212'][0]

formatEntity = (entity)->
  isbn = entity.claims['wdt:P212'][0]
  entity.uri = "isbn:#{normalizeIsbn(isbn)}"
  entity.type = 'edition'
  return entity

getMissingEntitiesFromSeeds = (isbns, refresh)->
  dataseed.getByIsbns isbns, refresh
  .then (seeds)->
    insufficientData = []
    validSeeds = []
    for seed in seeds
      if _.isNonEmptyString seed.title then validSeeds.push seed
      else insufficientData.push seed

    promises_.all validSeeds.map(scaffoldEntityFromSeed)
    .map formatEntity
    .then (newEntities)-> [ newEntities, insufficientData ]

extendWithIsbnData = (seed)-> _.extend seed, parseIsbn(seed.isbn)
