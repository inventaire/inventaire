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

urlBase =
  datatype: 'url'
  test: (str)-> _.isUrl(str) or _.isIpfsPath(str)
  format: _.identity

positiveIntegerBase =
  datatype: 'positive-integer'
  test: (value)-> _.isNumber(value) and value % 1 is 0 and value > 0
  format: _.identity

simpleDayBase =
  datatype: 'simple-day'
  # See SimpleDay specifications in [inventaire-client]/test/106-regex.coffee
  test: _.isSimpleDay
  format: _.identity

properties =
  # image
  'wdt:P18': urlBase
  # instance of
  'wdt:P31': entityUniqueValue
  # author
  'wdt:P50': entityBase
  # genre
  'wdt:P136': entityBase
  # serie
  'wdt:P179': entityUniqueValue
  # isbn 13
  'wdt:P212':
    datatype: 'string'
    test: (isbn)-> isbn_.isIsbn(isbn) is 13
    concurrency: true
    format: isbn_.normalizeIsbn
    uniqueValue: true
  # language of work
  'wdt:P407': entityBase
  # publication date
  'wdt:P577': simpleDayBase
  # edition or translation of
  'wdt:P629': entityUniqueValue
  # main subject
  'wdt:P921': entityBase
  # isbn 10
  'wdt:P957':
    datatype: 'string'
    test: (isbn)-> isbn_.isIsbn(isbn) is 10
    concurrency: true
    format: isbn_.normalizeIsbn
    uniqueValue: true
  # number of pages
  'wdt:P1104': positiveIntegerBase

whitelist = Object.keys properties

validateProperty = (property)->
  unless /^wdt:P\d+$/.test property
    throw error_.new 'invalid property', 400, property

  unless property in whitelist
    throw error_.new "property isn't whitelisted", 400, property

# which type those datatype should returned when passed to _.typeOf
datatypePrimordialType =
  string: 'string'
  entity: 'string'
  url: 'string'
  'positive-integer': 'number'
  'simple-day': 'string'

propertyDatatypePrimordialType = (property)->
  { datatype } = properties[property]
  return datatypePrimordialType[datatype]

testDataType = (property, value)-> _.typeOf(value) is propertyDatatypePrimordialType(property)

module.exports =
  properties: properties
  validateProperty: validateProperty
  testDataType: testDataType
  propertyDatatypePrimordialType: propertyDatatypePrimordialType
