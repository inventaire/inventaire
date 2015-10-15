__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require 'lib','books'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
# extending cache validity for limited APIs
{ oneYear } =  __.require 'lib', 'times'
{ stringObject } = require '../wrappers'

# getDataFromIsbn
module.exports = (isbn, maxAge=oneYear)->
  isbn = cleanIsbn isbn
  key = "google:#{isbn}"

  timespan = cache_.solveExpirationTime 'googleIsbn', maxAge
  cache_.get key, requestBooksDataFromIsbn.bind(null, isbn), timespan


requestBooksDataFromIsbn = (isbn)->
  promises_.get books_.API.google.isbn(isbn)
  .then parseBooksData.bind(null, isbn)


cleanIsbn = (isbn)->
  cleanedIsbn = books_.cleanIsbnData(isbn)
  if cleanedIsbn? then return cleanedIsbn
  else throw error_.new 'bad isbn', 401, isbn


parseBooksData = (isbn, res)->
  _.types arguments, ['string', 'object']

  {items} = res
  unless items?.length > 0
    _.warn res, "no item found for: #{isbn}"
    return

  book = findBook items, isbn

  unless book?
    _.warn "Google Books couldn't find the right book: #{isbn}"
    return

  book.source = 'google'
  book.authors = book.authors?.map stringObject
  return book


findBook = (items, isbn)->
  _.types arguments, ['array', 'string']
  book = null
  # loop on items until we find one matching the provided isbn
  while items.length > 0
    candidateItem = items.shift().volumeInfo
    book = books_.normalizeBookData candidateItem, isbn
    if book? then break

  return book
