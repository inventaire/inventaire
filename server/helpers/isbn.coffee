qreq = require 'qreq'
wikidata = require './wikidata'

module.exports =
  isISBN: (text)->
    cleanedText = text.trim().replace(/-/g, '').replace(/\s/g, '')
    if /^([0-9]{10}||[0-9]{13})$/.test(cleanedText)
      switch cleanedText.length
        when 10 then return 10
        when 13 then return 13
    return false


  getBookDataFromISBN: (isbn, lang)->
    return @getGoogleapisData(isbn)
    .then (bookData)->
      wikidata.bookFilteredSearch(bookData.title, lang)
    .fail (err)->
      throw new Error 'err at getBookDataFromISBN'


  getGoogleapisData: (isbn)->
    _.log cleanedIsbn = cleanIsbnData isbn, 'cleaned ISBN!'
    if cleanedIsbn?
      request = "https://www.googleapis.com/books/v1/volumes/?q=#{cleanedIsbn}"
      return qreq.get(request)
      .then (res)->
        _.logGreen res.body, "Entities:Search:res.body"
        if res.body.totalItems > 0
          _.logGreen res.body.items[0], "Entities:Search:res.body.items[0]"
          foundItem = res.body.items[0].volumeInfo
          _.logGreen foundItem, "Entities:Search:foundItem"
          return cleanBookData foundItem
        else throw new Error "no item found at: #{request}"
    else throw new Error "bad isbn"

cleanIsbnData = (isbn)->
  if typeof isbn is 'string'
    cleanedIsbn = isbn.trim().replace(/-/g, '').replace(/\s/g, '')
    if /^([0-9]{10}||[0-9]{13})$/.test cleanedIsbn
      return cleanedIsbn
    else _.logRed 'isbn got an invalid value'
  else _.logRed 'isbn should be a string'

cleanBookData = (foundItem)->
  obj =
    title: foundItem.title
    authors: foundItem.authors
    publisher: foundItem.publisher
    publishedDate: foundItem.publishedDate
    language: foundItem.language
  if foundItem.imageLinks?
    obj.pictures = [foundItem.imageLinks.thumbnail]
  return obj