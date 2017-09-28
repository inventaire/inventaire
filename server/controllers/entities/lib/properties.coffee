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

restrictedType = (base)-> (type)-> _.extend { restrictedType: type }, entityBase

entityRestrictedType = restrictedType entityBase
entityUniqueValueRestrictedType = restrictedType entityUniqueValue
workEntity = entityRestrictedType 'work'
serieEntity = entityRestrictedType 'serie'
humanEntity = entityRestrictedType 'human'

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

urlBase =
  datatype: 'string'
  test: _.isUrl
  format: _.identity

stringConcurrentBase = _.extend {}, stringUniqueBase, { concurrency: true }
# External ids regexs can be found on their Wikidata property page P1793 statement
externalId = (regex)-> _.extend {}, stringConcurrentBase, { test: regex.test.bind(regex) }

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
  'wdt:P50': humanEntity
  # publisher
  'wdt:P123': entityUniqueValue
  # original language of work
  'wdt:P364': entityBase
  # movement
  'wdt:P135': entityBase
  # genre
  'wdt:P136': entityBase
  # serie
  'wdt:P179': serieEntity
  # ISBN 13
  'wdt:P212': isbnProperty 13
  # VIAF id
  'wdt:P214': externalId /^[1-9]\d(\d{0,7}|\d{17,20})$/
  # BNF id
  'wdt:P268': externalId /^\d{8}[0-9bcdfghjkmnpqrstvwxz]$/
  # language of work
  'wdt:P407': entityBase
  # date of birth
  'wdt:P569': simpleDayUniqueValueBase
  # date of death
  'wdt:P570': simpleDayUniqueValueBase
  # publication date
  'wdt:P577': simpleDayUniqueValueBase
  # edition or translation of
  'wdt:P629': workEntity
  # Open Library id
  'wdt:P648': externalId /^OL[1-9]\d{0,7}[AMW]$/
  # translator
  'wdt:P655': humanEntity
  # influenced by
  'wdt:P737': entityBase
  # narrative set in
  'wdt:P840': entityBase
  # official website
  'wdt:P856': urlBase
  # main subject
  'wdt:P921': entityBase
  # ISBN 10
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
  # Twitter account
  'wdt:P2002': externalId /^\w{1,15}$/
  # Instagram username
  'wdt:P2003': externalId /^(\w(?:(?:\w|(?:\\.(?!\\.))){0,28}(?:\w))?)$/
  # Facebook profile id
  'wdt:P2013': externalId /^(\d+|[\w\.]+)$/
  # author of foreword
  'wdt:P2679': humanEntity
  # author of afterword
  'wdt:P2680': humanEntity

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
