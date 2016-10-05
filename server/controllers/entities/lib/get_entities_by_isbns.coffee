__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
indexById = require './index_by_id'
{ normalizeIsbn } = __.require 'lib', 'isbn/isbn'
dataseed = __.require 'data', 'dataseed/dataseed'

module.exports = (isbns)->
  # search entities by isbn locally
  entities_.byIsbns isbns
  .then (entities)->
    foundIsbns = entities.map getNormalizedIsbn
    _.log foundIsbns, 'foundIsbns'
    missingIsbns = _.difference isbns, foundIsbns
    _.log missingIsbns, 'missingIsbns'

    entities = indexById entities

    if missingIsbns.length is 0 then return { entities }

    # If some are missing, fetch data seeds as a place holder
    # to help the user creating the associated entities
    getSeedsByIsbns missingIsbns
    .then (seeds)-> { entities, seeds }

getNormalizedIsbn = (entity)-> normalizeIsbn entity.claims['wdt:P212'][0]
getSeedsByIsbns = (isbns)->
  dataseed.getByIsbns isbns
  .then (seeds)-> _.indexBy seeds, 'isbn'
