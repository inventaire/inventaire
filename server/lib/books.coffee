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
      else
        _.error body, 'Google Book response'
        throw "no item found for: #{cleanedIsbn}"
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
      else
        _.error body, 'Google Book response'
        throw "no item found for: #{text}"


module.exports.getImage = (data)->
  return @API.google.book(data)
  .then (res)=>
    if res.items?[0]?.volumeInfo?.imageLinks?.thumbnail?
      image = res.items[0].volumeInfo.imageLinks.thumbnail
      return {image: @normalize(image)}
    else console.warn "google book image not found for #{data}"
  .catch (err)-> _.error err, "google book err for data: #{data}"