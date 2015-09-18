__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'
{ getUrlFromKey, isbnUrl, coverByIsbn } = require './api'
getAuthors = require './authors'
{ oneYear } =  __.require 'lib', 'times'

module.exports = (isbn, maxAge=oneYear)->
  key = "ol:#{isbn}"
  cache_.get key, requestBook.bind(null, isbn), maxAge

requestBook = (isbn)->
  getBooksDataByIsbn isbn
  .then attachAuthors
  .then parseBookData.bind(null, isbn)
  .catch (err)->
    unless err.status is 404 then throw err
    _.warn isbn, err.message
    return


getBooksDataByIsbn = (isbn)->
  promises_.get isbnUrl(isbn)
  .then _.property('key')
  .then _.Log('key')
  .then (key)->
    if key? then promises_.get getUrlFromKey(key)
    else throw error_.new 'openlibrary: book not found', 404, isbn

attachAuthors = (bookData)->
  { authors } = bookData
  getAuthors authors
  .then (authorsData)->
    bookData.authors = authorsData
    return bookData


parseBookData = (isbn, bookData)->
  { title, authors, publish_date } = bookData
  return data =
    title: title
    authors: authors
    isbn: isbn
    uri: "isbn:#{isbn}"
    # matching Google Books vocabulary
    publisher: publishers?[0]
    publishedDate: publish_date
    pictures: [ coverByIsbn(isbn) ]
    source: 'openlibrary'
