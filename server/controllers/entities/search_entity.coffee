__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'
wikidata_ = __.require 'lib', 'wikidata'

getWikidataBookEntities = __.require 'data', 'wikidata/books'
getWikidataBookEntitiesByIsbn = __.require 'data', 'wikidata/books_by_isbn'

module.exports = searchEntity = (req, res)->
  _.info req.query, "Entities:Search"
  unless req.query.search? and req.query.language?
    err = 'empty query or no language specified'
    return _.errorHandler res, err, 400

  if books_.isIsbn(req.query.search)
    _.log req.query.search, 'searchByIsbn'
    searchByIsbn(req.query, res)

  else
    _.log req.query.search, 'searchByText'
    searchByText(req.query, res)


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books_.isIsbn(isbn)

  promises = [
    getWikidataBookEntitiesByIsbn(isbn, isbnType, query.language)
    .catch (err)-> _.error err, 'wikidata getBookEntityByISBN err'

    booksPromise = books_.getDataFromIsbn(isbn)
    .then((res)-> {items:[res], source: 'google'})
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  spreadRequests(res, promises, 'searchByIsbn')

searchByText = (query, res)->

  promises = [
    getWikidataBookEntities(query)
    .then (items)-> {items: items, source: 'wd', search: query.search}
    .catch (err)-> _.error err, 'wikidata getBookEntities err'

    books_.getDataFromText(query.search)
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
