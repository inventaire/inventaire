CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
books_ = __.require 'lib', 'books'
{ EntityUri } = __.require 'sharedLibs', 'regex'

entityBase =
  datatype: 'entity'
  test: EntityUri.test.bind EntityUri
  format: _.identity

entityUniqueValue = _.extend {}, entityBase, { uniqueValue: true }

properties =
  # instance of
  'wdt:P31': entityUniqueValue
  # author
  'wdt:P50': entityBase
  # genre
  'wdt:P136': entityBase
  # isbn 13
  'wdt:P212':
    datatype: 'string'
    test: (isbn)-> books_.isIsbn(isbn) is 13
    concurrency: true
    format: books_.normalizeIsbn
    uniqueValue: true
  # edition or translation of
  'wdt:P629': entityUniqueValue
  # main subject
  'wdt:P921': entityBase
  # isbn 10
  'wdt:P957':
    datatype: 'string'
    test: (isbn)-> books_.isIsbn(isbn) is 10
    concurrency: true
    format: books_.normalizeIsbn
    uniqueValue: true

whitelist = Object.keys properties

validateProperty = (property)->
  unless /^wdt:P\d+$/.test property
    throw error_.new 'invalid property', 400, property

  unless property in whitelist
    throw error_.new "property isn't whitelisted", 400, property

# there are only datatypes resolving to string for now
datatypePrimordialType =
  string: 'string'
  entity: 'string'

testDataType = (property, value)->
  { datatype } = properties[property]
  return _.typeOf(value) is datatypePrimordialType[datatype]

module.exports =
  properties: properties
  validateProperty: validateProperty
  testDataType: testDataType
