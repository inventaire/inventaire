__ = require('config').root
_ = __.require 'builders', 'utils'

promises_ = require './promises'
module.exports = books_ = __.require('sharedLibs','books')(_)

normalizeBookData = __.require('lib', 'normalize_book_data')(books_)

_.extend books_, normalizeBookData,
  API:
    # doc: https://developers.google.com/discovery/v1/performance
    google:
      book: (data)->
        "https://www.googleapis.com/books/v1/volumes/?q=#{data}&fields=totalItems,items(volumeInfo)&country=FR"
      isbn: (isbn)-> @book("isbn:#{isbn}")
    worldcat:
      # http://xisbn.worldcat.org/xisbnadmin/doc/api.htm
      isbnBaseRoute: 'http://xisbn.worldcat.org/webservices/xid/isbn/'
      to10: (isbn13)-> @isbnBaseRoute + "#{isbn13}?method=to10&format=json"
      to13: (isbn10)-> @isbnBaseRoute + "#{isbn10}?method=to13&format=json"
      hyphen: (isbn)-> @isbnBaseRoute + "#{isbn10}?method=hyphen&format=json"
