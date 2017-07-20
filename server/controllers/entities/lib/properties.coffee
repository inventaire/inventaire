CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
isbn_ = __.require 'lib', 'isbn/isbn'
{ EntityUri, SimpleDay } = __.require 'sharedLibs', 'regex'

entityBase =
  datatype: 'entity'
  test: EntityUri.test.bind EntityUri
  format: _.identity

entityUniqueValue = _.extend {}, entityBase, { uniqueValue: true }

ipfsPathBase =
  datatype: 'ipfs-path'
  test: _.isIpfsPath
  format: _.identity
  uniqueValue: true

positiveIntegerBase =
  datatype: 'positive-integer'
  test: (value)-> _.isNumber(value) and value % 1 is 0 and value > 0
  format: _.identity
  uniqueValue: true

simpleDayUniqueValueBase =
  datatype: 'simple-day'
  # See SimpleDay specifications in [inventaire-client]/test/106-regex.coffee
  test: _.isSimpleDay
  format: _.identity
  uniqueValue: true

stringUniqueBase =
  datatype: 'string'
  format: _.identity
  # Arbitrary max length
  test: (str)-> _.isString(str) and 0 < str.length < 5000
  uniqueValue: true

stringConcurrentBase = _.extend {}, stringUniqueBase, { concurrency: true }

isbnProperty = (num)->
  _.extend {}, stringConcurrentBase,
    test: (isbn)-> isbn? and isbn is isbn_.parse(isbn)?["isbn#{num}h"]
    uniqueValue: true
    format: isbn_["toIsbn#{num}h"]
    adminUpdateOnly: true

# For the moment, ordinals can be only positive integers, but stringified
# to stay consistent with Wikidata and let the door open to custom ordinals later
# (ex: roman numbers, letters, etc.)
ordinalBase =
  datatype: 'string'
  format: _.identity
  test: _.isPositiveIntegerString
  uniqueValue: true

# Keep in sync with app/modules/entities/lib/properties
# and app/modules/entities/lib/editor/properties_per_type
properties =
  # image
  'wdt:P18': ipfsPathBase
  # instance of
  'wdt:P31': _.extend {}, entityUniqueValue, { adminUpdateOnly: true }
  # author
  'wdt:P50': entityBase
  # publisher
  'wdt:P123': entityUniqueValue
  # original language of work
  'wdt:P364': entityBase
  # movement
  'wdt:P135': entityBase
  # genre
  'wdt:P136': entityBase
  # serie
  'wdt:P179': entityUniqueValue
  # isbn 13
  'wdt:P212': isbnProperty 13
  # language of work
  'wdt:P407': entityBase
  # date of birth
  'wdt:P569': simpleDayUniqueValueBase
  # date of death
  'wdt:P570': simpleDayUniqueValueBase
  # publication date
  'wdt:P577': simpleDayUniqueValueBase
  # edition or translation of
  'wdt:P629': entityBase
  # translator
  'wdt:P655': entityBase
  # influenced by
  'wdt:P737': entityBase
  # main subject
  'wdt:P921': entityBase
  # isbn 10
  'wdt:P957': isbnProperty 10
  # number of pages
  'wdt:P1104': positiveIntegerBase
  # languages of expression
  'wdt:P1412': entityBase
  # title
  'wdt:P1476': stringUniqueBase
  # series ordinal
  'wdt:P1545': ordinalBase
  # subtitle
  'wdt:P1680': stringUniqueBase
  # twitter account
  'wdt:P2002': stringConcurrentBase
  # author of foreword
  'wdt:P2679': entityBase
  # author of afterword
  'wdt:P2680': entityBase

whitelist = Object.keys properties

validateProperty = (property)->
  unless /^wdt:P\d+$/.test property
    throw error_.new 'invalid property', 400, property

  unless property in whitelist
    throw error_.new "property isn't whitelisted", 400, property

# which type those datatype should returned when passed to _.typeOf
datatypePrimordialType =
  string: 'string'
  number: 'number'
  entity: 'string'
  'ipfs-path': 'string'
  'positive-integer': 'number'
  'simple-day': 'string'

propertyDatatypePrimordialType = (property)->
  { datatype } = properties[property]
  return datatypePrimordialType[datatype]

testDataType = (property, value)-> _.typeOf(value) is propertyDatatypePrimordialType(property)

module.exports = {
  properties,
  validateProperty,
  testDataType,
  propertyDatatypePrimordialType
}
