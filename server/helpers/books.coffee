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

  getGoogleBooksDataFromISBN: (isbn, lang)->
    _.log cleanedIsbn = cleanIsbnData isbn, 'cleaned ISBN!'
    if cleanedIsbn?
      return qreq.get API.google.book(cleanedIsbn)
      .then (res)->
        if res.body.totalItems > 0
          # _.logGreen res.body.items[0], 'getGoogleBooksDataFromISBN rawItem'
          parsedItem = res.body.items[0].volumeInfo
          # _.logGreen parsedItem, 'getGoogleBooksDataFromISBN parsedItem'
          return cleanBookData parsedItem, isbn
        else throw new Error "no item found for: #{cleanedIsbn}"
    else throw new Error "bad isbn"

  getGoogleBooksDataFromText: (text)->
    if typeof text is 'string'
      return qreq.get API.google.book(text)
      .then (res)->
        if res.body.totalItems > 0
          # _.logGreen res.body.items[0], 'getGoogleBooksDataFromText rawItem'
          parsedItems = res.body.items.map (el)-> el.volumeInfo
          # _.logGreen cleanedItems, 'getGoogleBooksDataFromText cleanedItem'
          validResults = []
          parsedItems.forEach (el)->
            data = cleanBookData(el)
            validResults.push(data) if data?
          return validResults
        else throw new Error "no item found for: #{text}"
    else throw new Error 'typeError'

cleanIsbnData = (isbn)->
  if typeof isbn is 'string'
    cleanedIsbn = isbn.trim().replace(/-/g, '').replace(/\s/g, '')
    if /^([0-9]{10}||[0-9]{13})$/.test cleanedIsbn
      return cleanedIsbn
    else _.logRed 'isbn got an invalid value'
  else throw new Error 'typeError'

cleanBookData = (cleanedItem, isbn)->
  data =
    title: cleanedItem.title
    authors: cleanedItem.authors
    description: cleanedItem.description
    publisher: cleanedItem.publisher
    publishedDate: cleanedItem.publishedDate
    language: cleanedItem.language
    pictures: []

  if cleanedItem.industryIdentifiers?
    cleanedItem.industryIdentifiers.forEach (obj)->
      switch obj.type
        when 'ISBN_10' then data.P957 = obj.identifier
        when 'ISBN_13' then data.P212 = obj.identifier
        when 'OTHER' then otherId = obj.identifier

  isbn ||= data.P212 || data.P957

  if isbn?
    id = uri = "isbn:#{isbn}"
  else if otherId?
    id = uri = otherId
  else
    data.title.logIt 'no id found for. Will be droped', 'yellow'
    return

  if cleanedItem.imageLinks?
     data.pictures.push cleanedItem.imageLinks.thumbnail

  return data


API =
  google:
    book: (data)->
      "https://www.googleapis.com/books/v1/volumes/?q=#{data}".logIt 'GoogleBooks'