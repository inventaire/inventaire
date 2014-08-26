qreq = require 'qreq'

module.exports =
  getBookDataFromISBN: (isbn)->
    _.log cleanedIsbn = cleanIsbnData isbn, 'cleaned ISBN!'
    if cleanedIsbn?
      return qreq.get('https://www.googleapis.com/books/v1/volumes/?q=' + cleanedIsbn)
      .then (res)->
        _.logGreen res.body, "Entities:Search:res.body"
        if res.body.totalItems > 0
          _.logGreen res.body.items[0], "Entities:Search:res.body.items[0]"
          foundItem = res.body.items[0].volumeInfo
          _.logGreen foundItem, "Entities:Search:foundItem"
          return cleanBookData foundItem
        else
          return
    else
      return

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