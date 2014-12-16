breq = require 'breq'
__ = require('config').root
_ = __.require('builders', 'utils')

promises_ = require './promises'
module.exports = __.require('sharedLibs','books')(promises_, _)

module.exports.getGoogleBooksDataFromIsbn = (isbn)->
  cleanedIsbn = @cleanIsbnData(isbn).logIt('cleaned isbn')
  if cleanedIsbn?
    return @API.google.book(cleanedIsbn)
    .then (body)=>
      if body.totalItems > 0
        parsedItem = body.items[0].volumeInfo
        return @normalizeBookData parsedItem, isbn
      else throw "no item found for: #{cleanedIsbn}"
  else throw new Error "bad isbn"

module.exports.getGoogleBooksDataFromText = (text)->
  if _.typeString text
    return @API.google.book(text)
    .then (body)=>
      if body.totalItems > 0
        parsedItems = body.items.map (el)-> el.volumeInfo
        validResults = []
        parsedItems.forEach (el)=>
          data = @normalizeBookData(el)
          validResults.push(data) if data?
        return validResults
      else throw "no item found for: #{text}"