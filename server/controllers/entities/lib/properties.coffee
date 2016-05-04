CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
wdEntity = wdk.isWikidataEntityId
books_ = __.require 'lib', 'books'

wdEntityBase =
  datatype: 'entity'
  test: wdEntity
  format: _.identity

properties =
  # instance of
  P31: wdEntityBase
  # author
  P50: wdEntityBase
  # isbn 13
  P212:
    datatype: 'string'
    test: (isbn)-> books_.isIsbn(isbn) is 13
    concurrency: true
    format: books_.normalizeIsbn
  # edition or translation of
  P629: wdEntityBase
  # isbn 10
  P957:
    datatype: 'string'
    test: (isbn)-> books_.isIsbn(isbn) is 10
    concurrency: true
    format: books_.normalizeIsbn

whitelist = Object.keys properties

validateProperty = (property)->
  unless /P\d+/.test property
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
