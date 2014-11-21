_ = require('config').root.require('builders', 'utils')

books = require '../lib/books'
wikidata = require '../lib/wikidata'
Promise = require 'bluebird'

module.exports =
  search: (req, res, next) ->
    _.info req.query, "Entities:Search"

    if req.query.search? and req.query.language?

      if books.isIsbn(req.query.search)
        _.log req.query.search, 'searchByIsbn'
        searchByIsbn(req.query, res)

      else
        _.log req.query.search, 'searchByText'
        searchByText(req.query, res)

    else  _.errorHandler res, 'empty query or no language specified', 400


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books.isIsbn(isbn)

  promises = [
    wikidata.getBookEntityByIsbn(isbn, isbnType, query.language)
    .catch (err)-> _.error err, 'wikidata getBookEntityByISBN err'

    booksPromise = books.getGoogleBooksDataFromIsbn(isbn)
    .then((res)-> {items:[res], source: 'google'})
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  spreadRequests(res, promises, 'searchByIsbn')

searchByText = (query, res)->

  promises = [
    wikidata.getBookEntities(query)
    .then (items)-> {items: items, source: 'wd', search: query.search}
    .catch (err)-> _.error err, 'wikidata getBookEntities err'

    books.getGoogleBooksDataFromText(query.search)
    .then (res)-> {items: res, source: 'google', search: query.search}
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  spreadRequests(res, promises, 'searchByText')


spreadRequests = (res, promises, label)->

  Promise.all(promises).spread(selectFirstNonEmptyResult)
  .then (selected)->
    if selected?
      res.json selected
    else res.json 404, 'not found'

  .catch (err)->
    _.error err, "#{label} err"
    _.errorHandler res, err
  .done()

selectFirstNonEmptyResult = (results...)->
  _.info results, "api results"
  selected = null
  results.forEach (result)->
    if result.items?.length > 0 and not selected?
      selected = result
  selected?.source.logIt('selected source')
  return selected