__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
{ parse:parseIsbn, normalizeIsbn } = __.require 'lib', 'isbn/isbn'
dataseed = __.require 'data', 'dataseed/dataseed'
scaffoldEditionEntityFromSeed = require './scaffold_entity_from_seed/edition'
formatEditionEntity = require './format_edition_entity'

module.exports = (isbns, refresh)->
  # search entities by isbn locally
  entities_.byIsbns isbns
  .then (entities)->
    foundIsbns = entities.map getNormalizedIsbn
    _.log foundIsbns, 'foundIsbns'
    missingIsbns = _.difference isbns, foundIsbns
    _.log missingIsbns, 'missingIsbns'

    entities = entities.map formatEditionEntity

    if missingIsbns.length is 0 then return { entities }

    # then look for missing isbns on dataseed
    getMissingEditionEntitiesFromSeeds missingIsbns, refresh
    .spread (newEntities, notFound)->
      data =
        entities: entities.concat newEntities

      if notFound.length > 0 then data.notFound = notFound

      return data

getNormalizedIsbn = (entity)-> normalizeIsbn entity.claims['wdt:P212'][0]

getMissingEditionEntitiesFromSeeds = (isbns, refresh)->
  dataseed.getByIsbns isbns, refresh
  .then (seeds)->
    insufficientData = []
    validSeeds = []
    for seed in seeds
      if _.isNonEmptyString seed.title then validSeeds.push seed
      else insufficientData.push seed

    promises_.all validSeeds.map(scaffoldEditionEntityFromSeed)
    .map formatEditionEntity
    .then (newEntities)-> [ newEntities, insufficientData ]
