__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getUrlFromKey, isbnUrl, coverById, coverByIsbn } = require './api'
attachAuthors = require './attach_authors'

module.exports = (bookData)->
  attachAuthors bookData
  .then format

format = (bookData)->
  { covers, title, authors, publish_date, number_of_pages } = bookData
  isbn = findIsbn bookData

  return data =
    title: title
    authors: authors
    isbn: isbn
    uri: "isbn:#{isbn}"
    # matching Google Books vocabulary
    # publisher: publishers?[0]
    publishedDate: if _.isString(publish_date) then publish_date
    pageCount: number_of_pages
    pictures: _.log(findCover(covers, isbn), 'cover')
    source: 'ol'
    raw: bookData

findCover = (covers, isbn)->
  if covers? then return covers.map(bookCover)
  if isbn? then return [ coverByIsbn(isbn, 'book') ]
  return []

bookCover = (coverId)-> coverById coverId, 'book'

findIsbn = (bookData)->
  # 'isbn' might be attached in previous parsing
  { isbn, isbn_13, isbn_10 } = bookData
  if _.isArray isbn then isbn = findIsbn13 isbn
  return isbn or isbn_13 or isbn_10


findIsbn13 = (isbn)->
  # assume there won't be more than two isbns
  [ one, two ] = isbn
  unless two? then return one

  if one.length > two.length then one else two
