qreq = require 'qreq'

module.exports =
  search: (req, res, next) ->
    _.logBlue "Entities:Search"
    if req.query.isbn?
      getBookDataFromISBN req.query.isbn
      .then (body)-> _.sendJSON res, body
      .fail (err)-> _.errorHandler res, err
      .done()
    else
      _.errorHandler res, 'invalid query'

getBookDataFromISBN = (isbn)->
  # isbn = cleanIsbnData ISBN
  _.log cleanedIsbn = cleanIsbnData isbn, 'cleaned ISBN!'
  return qreq.get('https://www.googleapis.com/books/v1/volumes/?q=' + cleanedIsbn)
  .then (res)->
    _.logGreen res.body, "Entities:Search:res.body"
    _.logGreen res.body.items[0], "Entities:Search:res.body.items[0]"
    foundItem = res.body.items[0].volumeInfo
    _.logGreen foundItem, "Entities:Search:foundItem"
    # switch cleanedIsbn.length
    #   when 10 then foundIsbn = foundItem.industryIdentifiers[0].identifier
    #   when 13 then foundIsbn = foundItem.industryIdentifiers[1].identifier
    # if cleanedIsbn == foundIsbn
    return cleanBookData foundItem
    # else
      # _.logRed [cleanedIsbn, foundIsbn], 'result not matching the isbn queried'

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