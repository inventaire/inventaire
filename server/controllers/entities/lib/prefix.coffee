__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ BoundedString } = __.require 'models', 'validations/common'
wdk = require 'wikidata-sdk'
isbn_ = __.require 'lib', 'isbn/isbn'

prefixify = (id, prefix)->
  unless id? then return
  if prefix? then return "#{prefix}:#{id}"

  if wdk.isItemId id then return "wd:#{id}"
  else if _.isInvEntityId id then return "inv:#{id}"
  else if wdk.isPropertyId id then return "wdt:#{id}"
  else if isbn_.isValidIsbn id then return "isbn:#{isbn_.normalizeIsbn(id)}"
  else throw new Error 'unknown id format'

Prefixify = (prefix)-> (id)-> prefixify id, prefix

prefixifyWd = Prefixify 'wd'
prefixifyInv = Prefixify 'inv'
prefixifyIsbn = (isbn)-> prefixify isbn_.normalizeIsbn(isbn), 'isbn'

unprefixify = (uri)-> uri.split(':')[1]

module.exports = { prefixify, Prefixify, unprefixify, prefixifyWd, prefixifyInv, prefixifyIsbn }
