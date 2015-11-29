__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'
booksData_ = __.require 'lib', 'books_data'
wikidata_ = __.require 'lib', 'wikidata'

getWikidataBookEntities = __.require 'data', 'wikidata/books'
getWikidataBookEntitiesByIsbn = __.require 'data', 'wikidata/books_by_isbn'
searchOpenLibrary = __.require 'data', 'openlibrary/search'

module.exports = searchEntity = (req, res)->
  {query} = req
  {search, language} = query
  _.info query, "Entities:Search"

  unless search?.length > 0
    return error_.bundle res, 'empty query' , 400

  unless language?
    return error_.bundle res, 'no language specified' , 400

  # make sure we have a 2 letters language code
  language = _.shortLang language

  if books_.isIsbn(search)
    _.log search, 'searchByIsbn'
    searchByIsbn(query, res)

  else
    _.log search, 'searchByText'
    searchByText(query, res)


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books_.isIsbn(isbn)

  cleanedIsbn = books_.cleanIsbnData(isbn)

  promises = [
    getWikidataBookEntitiesByIsbn(isbn, isbnType, query.language)
    getBooksDataFromIsbn(cleanedIsbn)
  ]
  # adding a 10 seconds timeout on requests
  .map promises_.Timeout(10000)

  spreadRequests res, promises, 'searchByIsbn'

getBooksDataFromIsbn = (cleanedIsbn)->
  booksData_.getDataFromIsbn cleanedIsbn
  # getDataFromIsbn returns an index of entities
  # so it need to be converted to a collection
  .then parseBooksDataFromIsbn
  .catch _.Error('getBooksDataFromIsbn err')

parseBooksDataFromIsbn = (res)->
  _.type res, 'object'
  { source } = res
  _.type source, 'string'
  { items: [res], source: source }

searchByText = (query, res)->

  promises = [
    getWikidataBookEntities(query)
    .then (items)-> {items: items, source: 'wd', search: query.search}
    .catch _.Error('wikidata getBookEntities err')

    # searchOpenLibrary(query)
    # .then (items)-> {items: items, source: 'ol', search: query.search}

    booksData_.getDataFromText(query.search)
    .then (res)-> {items: res, source: 'google', search: query.search}
    .catch _.Error('getGoogleBooksDataFromText err')
  ]
  # adding a 10 seconds timeout on requests
  .map promises_.Timeout(10000)

  spreadRequests res, promises, 'searchByText'


spreadRequests = (res, promises, label)->
  promises_.settle promises
  .then bundleResults
  .then res.json.bind(res)
  .catch error_.Handler(res)

bundleResults = (results)->
  resp = {}

  for result in _.compact(results)
    { source, items } = result
    # also tests if the first item isnt undefined
    if _.isArray(items) and items[0]?
      resp[source] = result
      # resp.search or= result.search

  unless _.objLength(resp) > 0
    throw error_.new 'empty search result', 404

  return resp