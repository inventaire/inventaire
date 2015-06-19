__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'lib', 'entities'

module.exports = (isbn)->
  entities_.byIsbn isbn
  .then parseBooksData.bind(null, isbn)
  .catch _.Error('inv entities byIsbn')


parseBooksData = (isbn, book)->
  result = {}
  if book?
    book.uri = findUri book
    book.pictures or= []
    result[isbn] = book
  return result

findUri = (book)->
  { _id, isbn } = book
  if isbn? then "isbn:#{isbn}"
  else "inv:#{_id}"
