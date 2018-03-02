CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
isbn_ = __.require 'lib', 'isbn/isbn'
{ EntityUri, SimpleDay } = __.require 'sharedLibs', 'regex'
{ BoundedString } = __.require 'models', 'tests/common'

entity =
  datatype: 'entity'
  primordialDatatype: 'string'
  validate: EntityUri.test.bind EntityUri

uniqueString =
  datatype: 'string'
  # Arbitrary max length
  validate: BoundedString 1, 5000
  uniqueValue: true

restrictedEntityType = (type)-> _.extend { restrictedType: type }, entity

module.exports =
  entity: entity
  workEntity: restrictedEntityType 'work'
  serieEntity: restrictedEntityType 'serie'
  humanEntity: restrictedEntityType 'human'
  uniqueEntity: _.extend {}, entity, { uniqueValue: true }

  uniqueString: uniqueString
  concurrentString: _.extend {}, uniqueString, { concurrency: true }
  # For the moment, ordinals can be only positive integers, but stringified
  # to stay consistent with Wikidata and let the door open to custom ordinals
  # later (ex: roman numbers, letters, etc.)

  url:
    datatype: 'string'
    validate: _.isUrl

  uniqueSimpleDay:
    datatype: 'simple-day'
    primordialDatatype: 'string'
    # See SimpleDay specifications in [inventaire-client]/test/106-regex.coffee
    validate: _.isSimpleDay
    uniqueValue: true

  positiveInteger:
    datatype: 'positive-integer'
    primordialDatatype: 'number'
    validate: (value)-> _.isNumber(value) and value % 1 is 0 and value > 0
    uniqueValue: true

  ordinal:
    datatype: 'string'
    validate: _.isPositiveIntegerString
    uniqueValue: true

  ipfsPath:
    datatype: 'ipfs-path'
    primordialDatatype: 'string'
    validate: _.isIpfsPath
    uniqueValue: true
