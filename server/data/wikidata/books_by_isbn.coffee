__ = require('config').root
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'
wd_ = __.require 'lib', 'wikidata'
cache_ = __.require 'lib', 'cache'

module.exports = (isbn, type, lang)->
  key = "wdIsbn:#{isbn}:#{lang}"
  cache_.get key, requestBookEntityByIsbn.bind(null, isbn, type, lang)


requestBookEntityByIsbn = (isbn, type, lang)->
  url = wikidataIsbnClaim(isbn, type)
  promises_.get(url)
  .then parseResponse.bind(null, isbn)
  .catch (err)-> _.error err, 'err at getBookEntityByIsbn'

wikidataIsbnClaim = (isbn, type)->
  switch type
    when 10 then return wd_.API.wmflabs.string 957, isbn
    when 13 then return wd_.API.wmflabs.string 212, isbn

parseResponse = (isbn, res)->
  unless res?.items?.length > 0
    return normalizeResult isbn, [], 'no item found for this isbn'

  id = wd_.normalizeId(res.items[0])
  wd_.getEntities(id, lang)
  .then wd_.filterAndBrush
  .then normalizeResult.bind(null, isbn)

normalizeResult = (isbn, items, status)->
  items: items
  source: 'wd'
  isbn: isbn
  status: status
