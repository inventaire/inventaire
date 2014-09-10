qreq = require 'qreq'

module.exports =
  getGoogleBooksDataFromISBN: (isbn, lang)->
    if (cleanedIsbn = cleanIsbnData(isbn).logIt('cleaned isbn'))?
      return qreq.get API.google.book(cleanedIsbn)
      .then (res)->
        if res.body.totalItems > 0
          parsedItem = res.body.items[0].volumeInfo
          return normalizeBookData parsedItem, isbn
        else throw "no item found for: #{cleanedIsbn}"
    else throw new Error "bad isbn"

  isIsbn: (text)->
    cleanedText = normalizeIsbn(text)
    if isNormalizedIsbn cleanedText
      switch cleanedText.length
        when 10 then return 10
        when 13 then return 13
    return false

  getGoogleBooksDataFromText: (text)->
    if _.typeString text
      return qreq.get API.google.book(text)
      .then (res)->
        if res.body.totalItems > 0
          parsedItems = res.body.items.map (el)-> el.volumeInfo
          validResults = []
          parsedItems.forEach (el)->
            data = normalizeBookData(el)
            validResults.push(data) if data?
          return validResults
        else throw "no item found for: #{text}"

normalizeIsbn = (text)-> text.trim().replace(/-/g, '').replace(/\s/g, '')
isNormalizedIsbn = (text)-> /^([0-9]{10}|[0-9]{13})$/.test text

cleanIsbnData = (isbn)->
  if _.typeString isbn
    if isNormalizedIsbn(cleanedIsbn = normalizeIsbn(isbn))
      return cleanedIsbn
    else console.error 'isbn got an invalid value'


normalizeBookData = (cleanedItem, isbn)->
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

  if isbn? then data.id = data.uri = "isbn:#{isbn}"
  else if otherId? then data.id = data.uri = otherId
  else throw 'no id found normalizeBookData. Will be droped'

  if cleanedItem.imageLinks?
     data.pictures.push cleanedItem.imageLinks.thumbnail

  return data


API =
  google:
    book: (data)->
      "https://www.googleapis.com/books/v1/volumes/?q=#{data}".logIt 'GoogleBooks'