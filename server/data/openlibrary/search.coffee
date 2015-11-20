__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'
{ searchUrl } = require './api'
{ oneYear } =  __.require 'lib', 'times'
formatBook = require './format_book'

module.exports = (query)->
  { search } = query
  promises_.get searchUrl(search)
  # /!\ return works, not editions
  .then _.property('docs')
  .then filterEditions
  .then formatBooks
  .then _.Tap(logFirstBook)
  .catch _.Error('ol search')

logFirstBook = (books)-> _.log books[1], 'first result'

filterEditions = (docs)->
  _.log docs[0], 'first doc'
  _.log docs.length, 'docs before filter'
  filteredDocs = docs.filter (doc)-> doc.isbn?
  _.log filteredDocs.length, 'docs after filter'
  return filteredDocs


formatBooks = (booksDocs)->
  promises_.all booksDocs.map(formatBook)