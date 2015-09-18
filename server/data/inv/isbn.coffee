__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'lib', 'entities'
{ stringObject } = require '../wrappers'

module.exports = (isbn)->
  entities_.byIsbn isbn
  .then parseBooksData.bind(null, isbn)
  .catch _.Error('inv entities byIsbn')


parseBooksData = (isbn, book)->
  unless book? then return

  book.authors = book.authors?.map stringObject

  return _.extend book,
    uri: "isbn:#{isbn}"
    pictures: []
    source: 'inv'
