__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'
wikidata_ = __.require 'lib', 'wikidata'

getWikidataBookEntities = __.require 'data', 'wikidata/books'
getWikidataBookEntitiesByIsbn = __.require 'data', 'wikidata/books_by_isbn'

module.exports = searchEntity = (req, res)->
  {query} = req
  _.info query, "Entities:Search"

  unless query.search?.length > 0
    return error_.bundle res, 'empty query' , 400

  unless query.language?
    return error_.bundle res, 'no language specified' , 400

  if books_.isIsbn(query.search)
    _.log query.search, 'searchByIsbn'
    searchByIsbn(query, res)

  else
    _.log query.search, 'searchByText'
    searchByText(query, res)


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books_.isIsbn(isbn)

  cleanedIsbn = books_.cleanIsbnData(isbn)

  promises = [
    getWikidataBookEntitiesByIsbn(isbn, isbnType, query.language)
    .catch (err)-> _.error err, 'wikidata getBookEntityByISBN err'

    booksPromise = books_.getDataFromIsbn(cleanedIsbn)
    # returns an index of entities, so it need to be converted to a collection
    .then (res)-> [res[cleanedIsbn]]
    .then((res)-> {items: res, source: 'google'})
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  promises = promises.map (promise)-> promise.timeout 10000

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

  # adding a 10 seconds timeout on requests
  promises = promises.map (promise)-> promise.timeout 10000

  spreadRequests(res, promises, 'searchByText')


spreadRequests = (res, promises, label)->
  promises_.settle(promises)
  .spread(bundleResults)
  .then (resp)->
    if resp.wd? or resp.google? then res.json resp
    else res.status(404).json {error: 'not found'}
  .catch error_.Handler(res)

bundleResults = (results...)->
  _.info results, "api results"
  resp = {}
  results.forEach (result)->
    {source, items} = result
    # also tests if the first item isnt undefined
    if _.isArray(items) and items[0]?
      resp[source] = result
      resp.search or= result.search

  return resp