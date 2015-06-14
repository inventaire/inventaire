__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require 'lib','books'
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'

# getDataFromIsbn
module.exports = (isbn, timespan)->
  isbn = cleanIsbn(isbn)
  key = "google:#{isbn}"
  cache_.get key, requestBooksDataFromIsbn.bind(null, isbn), timespan


requestBooksDataFromIsbn = (isbn)->
  promises_.get books_.API.google.isbn(isbn)
  .then parseBooksData.bind(null, isbn)


cleanIsbn = (isbn)->
  cleanedIsbn = books_.cleanIsbnData(isbn)
  if cleanedIsbn? then return cleanedIsbn
  else throw new Error "bad isbn"


parseBooksData = (isbn, res)->
  _.types arguments, ['string', 'object']

  {items} = res
  unless items?.length > 0
    _.error res, 'Google Book response'
    _.warn "no item found for: #{isbn}"
    return

  book = findBook(items, isbn)

  unless book?
    _.warn "couldn't find the right book: #{isbn}"
    return

  result = {}
  result[isbn] = book
  return result



findBook = (items, isbn)->
  _.types arguments, ['array', 'string']
  book = null
  # loop on items until we find one matching the provided isbn
  while items.length > 0
    candidateItem = items.shift().volumeInfo
    book = books_.normalizeBookData candidateItem, isbn
    if book? then break

  return book
