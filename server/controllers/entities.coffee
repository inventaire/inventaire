books = require '../helpers/books'
wikidata = require '../helpers/wikidata'
Q = require 'q'

module.exports =
  search: (req, res, next) ->
    _.logBlue req.query, "Entities:Search"

    if req.query.search? and req.query.language?

      if books.isISBN(req.query.search)
        _.logYellow req.query.search, 'searchByIsbn'
        searchByIsbn(req.query, res)

      else
        _.logYellow req.query.search, 'searchByText'
        searchByText(req.query, res)

    else  _.errorHandler res, 'empty query or no language specified', 400


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books.isISBN(isbn)

  promises = [
    wikidata.getBookEntityByISBN(isbn, isbnType, query.language)

    booksPromise = books.getGoogleBooksDataFromISBN(isbn)
    .then((res)-> {items:[res], source: 'google'})
  ]

  spreadRequests(res, promises, 'searchByIsbn')

searchByText = (query, res)->

  promises = [
    wikidata.getBookEntities(query)
    .then (filteredAndBrushed)->
      _.log filteredAndBrushed, 'filteredAndBrushed'
      {items: filteredAndBrushed, source: 'wd'}
    .fail (err)->
      _.logRed err, 'wikidata getBookEntities promises err'
      {status: "no item found for #{query.search}", query: query, items: [], source: 'wd'}

    books.getGoogleBooksDataFromText(query.search).then (res)-> {items: res, source: 'google'}
  ]

  spreadRequests(res, promises, 'searchByText')


spreadRequests = (res, promises, label)->

  Q.spread promises, (results...)->
    _.logBlue results, "api results for #{label}"

    success = false
    results.forEach (result)->
      if result.items[0]?
        success = true
        _.sendJSON res, result

    unless success
      _.sendJSON res, { status: 'not found', details: results}, 404

  .fail (err)->
    _.logRed err, "#{label} err"
    _.errorHandler res, err
  .done()