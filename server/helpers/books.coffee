qreq = require 'qreq'

module.exports = sharedLib 'books'

module.exports.getGoogleBooksDataFromIsbn = (isbn)->
  cleanedIsbn = @cleanIsbnData(isbn).logIt('cleaned isbn')
  if cleanedIsbn?
    return qreq.get API.google.book(cleanedIsbn)
    .then (res)=>
      if res.body.totalItems > 0
        parsedItem = res.body.items[0].volumeInfo
        return @normalizeBookData parsedItem, isbn
      else throw "no item found for: #{cleanedIsbn}"
  else throw new Error "bad isbn"

module.exports.getGoogleBooksDataFromText = (text)->
  if _.typeString text
    return qreq.get API.google.book(text)
    .then (res)=>
      if res.body.totalItems > 0
        parsedItems = res.body.items.map (el)-> el.volumeInfo
        validResults = []
        parsedItems.forEach (el)=>
          data = @normalizeBookData(el)
          validResults.push(data) if data?
        return validResults
      else throw "no item found for: #{text}"

API =
  google:
    book: (data)->
      "https://www.googleapis.com/books/v1/volumes/?q=#{data}".logIt 'GoogleBooks'