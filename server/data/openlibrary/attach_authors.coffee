__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getAuthors = require './authors'

module.exports = (bookData)->
  { authors, author_key } = bookData
  author_key = if author_key? then formatAuthorKey(author_key)
  authorsKeys = authors?.map(_.property('key')) or author_key or []
  getAuthors authorsKeys
  .then (authorsData)->
    bookData.authors = authorsData
    return bookData
  .catch (err)->
    _.warn err, "couldn't attach authors"
    return bookData

formatAuthorKey = (keys)->
  keys.map (key)-> "/authors/#{key}"
