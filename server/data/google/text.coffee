__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require 'lib','books'
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'
# extending cache validity for limited APIs
{ oneYear } =  __.require 'lib', 'times'


# getDataFromText
module.exports = (text, timespan=oneYear)->
  _.typeString text
  key = "google:#{text}"
  cache_.get key, requestBooksDataFromText.bind(null, text), timespan


requestBooksDataFromText = (text)->
  promises_.get books_.API.google.book(text)
  .then parseBooksData.bind(null, text)

parseBooksData = (text, res)->
  if res.totalItems > 0
    parsedItems = res.items.map(normalizeBookData)
    return  _.compact parsedItems
  else
    _.warn res, 'Google Book found no book'
    return

normalizeBookData = (item)->
  books_.normalizeBookData(item.volumeInfo)