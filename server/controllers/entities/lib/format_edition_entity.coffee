__ = require('config').universalPath
{ normalizeIsbn } = __.require 'lib', 'isbn/isbn'
formatEntityCommon = require './format_entity_common'

module.exports = (entity)->
  isbn = entity.claims['wdt:P212'][0]
  entity.uri = "isbn:#{normalizeIsbn(isbn)}"
  entity.type = 'edition'
  return formatEntityCommon entity
