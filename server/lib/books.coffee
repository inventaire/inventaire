CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ useKey, key } = CONFIG.googleBooks
qs = require 'querystring'

promises_ = require './promises'
module.exports = books_ = __.require('sharedLibs','books')(_)

normalizeBookData = __.require('lib', 'normalize_book_data')(books_)

gbBase = "https://www.googleapis.com/books/v1/volumes/?fields=totalItems,items(volumeInfo)&country=US"
if useKey
  googleBooks = (data)->
    data = qs.escape data
    "#{gbBase}&q=#{data}&key=#{key}"
else
  googleBooks = (data)->
    data = qs.escape data
    "#{gbBase}&q=#{data}"

_.extend books_, normalizeBookData,
  API:
    # doc: https://developers.google.com/discovery/v1/performance
    google:
      book: googleBooks
      # not using the form "isbn:#{isbn}" as some results don't appear
      # with the prefix 'isbn:'
      isbn: (isbn)-> @book isbn
