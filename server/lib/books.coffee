CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ useKey, key } = CONFIG.googleBooks

promises_ = require './promises'
module.exports = books_ = __.require('sharedLibs','books')(_)

normalizeBookData = __.require('lib', 'normalize_book_data')(books_)

gbBase = "https://www.googleapis.com/books/v1/volumes/?fields=totalItems,items(volumeInfo)&country=US"
if useKey then googleBooks = (data)->"#{gbBase}&q=#{data}&key=#{key}"
else googleBooks = (data)-> "#{gbBase}&q=#{data}"

_.extend books_, normalizeBookData,
  API:
    # doc: https://developers.google.com/discovery/v1/performance
    google:
      book: googleBooks
      # not using the form "isbn:#{isbn}" as some results don't appear
      # with the prefix 'isbn:'
      isbn: (isbn)-> @book isbn
    worldcat:
      # http://xisbn.worldcat.org/xisbnadmin/doc/api.htm
      isbnBaseRoute: 'http://xisbn.worldcat.org/webservices/xid/isbn/'
      to10: (isbn13)-> @isbnBaseRoute + "#{isbn13}?method=to10&format=json"
      to13: (isbn10)-> @isbnBaseRoute + "#{isbn10}?method=to13&format=json"
      hyphen: (isbn)-> @isbnBaseRoute + "#{isbn10}?method=hyphen&format=json"
