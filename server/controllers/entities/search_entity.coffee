__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
books = __.require 'lib', 'books'
wikidata = __.require 'lib', 'wikidata'

module.exports = searchEntity = (req, res)->
    _.info req.query, "Entities:Search"
    unless req.query.search? and req.query.language?
      err = 'empty query or no language specified'
      return _.errorHandler res, err, 400

    if books.isIsbn(req.query.search)
      _.log req.query.search, 'searchByIsbn'
      searchByIsbn(req.query, res)

    else
      _.log req.query.search, 'searchByText'
      searchByText(req.query, res)


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books.isIsbn(isbn)

  promises = [
    wikidata.getBookEntityByIsbn(isbn, isbnType, query.language)
    .catch (err)-> _.error err, 'wikidata getBookEntityByISBN err'

    booksPromise = books.getDataFromIsbn(isbn)
    .then((res)-> {items:[res], source: 'google'})
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  spreadRequests(res, promises, 'searchByIsbn')

searchByText = (query, res)->

  promises = [
    wikidata.getBookEntities(query)
    .then (items)-> {items: items, source: 'wd', search: query.search}
    .catch (err)-> _.error err, 'wikidata getBookEntities err'

    books.getDataFromText(query.search)
    .then (res)-> {items: res, source: 'google', search: query.search}
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  # adding a 4 seconds timeout on requests
  promises = promises.map (promise)-> promise.timeout 10000

  spreadRequests(res, promises, 'searchByText')


spreadRequests = (res, promises, label)->
  promises_.settle(promises).spread(selectFirstNonEmptyResult)
  .then (selected)->
    if selected?
      res.json selected
    else res.json 404, 'not found'

  .catch (err)->
    _.error err, "#{label} err"
    _.errorHandler res, err

selectFirstNonEmptyResult = (results...)->
  _.info results, "api results"
  selected = null
  results.forEach (result)->
    if result.items?.length > 0 and not selected?
      selected = result
  selected?.source.logIt('selected source')
  return selected
