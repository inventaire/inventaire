CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
isbn_ = __.require 'lib', 'isbn/isbn'
{ EntityUri, SimpleDay } = __.require 'sharedLibs', 'regex'

entity =
  datatype: 'entity'
  test: EntityUri.test.bind EntityUri

uniqueString =
  datatype: 'string'
  # Arbitrary max length
  test: (str)-> _.isString(str) and 0 < str.length < 5000
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
    test: _.isUrl

  uniqueSimpleDay:
    datatype: 'simple-day'
    # See SimpleDay specifications in [inventaire-client]/test/106-regex.coffee
    test: _.isSimpleDay
    uniqueValue: true

  positiveInteger:
    datatype: 'positive-integer'
    test: (value)-> _.isNumber(value) and value % 1 is 0 and value > 0
    uniqueValue: true

  ordinal:
    datatype: 'string'
    test: _.isPositiveIntegerString
    uniqueValue: true

  ipfsPath:
    datatype: 'ipfs-path'
    test: _.isIpfsPath
    uniqueValue: true
