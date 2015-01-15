__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require('sharedLibs','books')(_)
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'

# getDataFromIsbn
module.exports = (isbn)->
  isbn = cleanIsbn(isbn)
  key = "google:#{isbn}"
  cache_.get key, requestBooksDataFromIsbn.bind(null, isbn)


requestBooksDataFromIsbn = (isbn)->
  promises_.get books_.API.google.book(isbn)
  .then parseBooksData.bind(null, isbn)


cleanIsbn = (isbn)->
  cleanedIsbn = books_.cleanIsbnData(isbn).logIt('cleaned isbn')
  if cleanedIsbn? then return cleanedIsbn
  else throw new Error "bad isbn"


parseBooksData = (isbn, res)->
  _.types arguments, ['string', 'object']
  if res?.totalItems > 0
    parsedItem = res.items[0].volumeInfo
    return books_.normalizeBookData parsedItem, isbn
  else
    _.error res, 'Google Book response'
    throw new Error "no item found for: #{cleanedIsbn}"
