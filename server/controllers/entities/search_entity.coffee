__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'
booksData_ = __.require 'lib', 'books_data'
wikidata_ = __.require 'lib', 'wikidata'

searchWikidataEntities = __.require 'data', 'wikidata/entities'
searchLocalEntities = require './search_local'
getWikidataBookEntitiesByIsbn = __.require 'data', 'wikidata/books_by_isbn'
searchOpenLibrary = __.require 'data', 'openlibrary/search'
filteredSearch = require './filtered_search'

module.exports = (req, res)->
  { query } = req
  { search, language, filter } = query
  _.info query, 'entities search'

  unless _.isNonEmptyString search
    return error_.bundle req, res, 'empty query' , 400

  unless language?
    return error_.bundle req, res, 'no language specified' , 400

  # make sure we have a 2 letters language code
  query.language = _.shortLang language

  if _.isNonEmptyString filter
    return filteredSearch query, res

  if books_.isIsbn search
    _.log search, 'searchByIsbn'
    promises = searchByIsbn query

  else
    _.log search, 'searchByText'
    promises = searchByText query

  promises_.all promises
  .then bundleResults
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

searchByIsbn = (query)->
  isbn = query.search
  isbnType = books_.isIsbn isbn

  cleanedIsbn = books_.cleanIsbnData isbn

  return promises = [
    getWikidataBookEntitiesByIsbn isbn, isbnType, query.language
    .timeout(10000)
    .catch _.Error('getWikidataBookEntitiesByIsbn')

    getBooksDataFromIsbn cleanedIsbn
    .timeout(10000)
    .catch _.Error('getBooksDataFromIsbn err')
  ]

getBooksDataFromIsbn = (cleanedIsbn)->
  booksData_.getDataFromIsbn cleanedIsbn
  # getDataFromIsbn returns an index of entities
  # so it need to be converted to a collection
  .then parseBooksDataFromIsbn

parseBooksDataFromIsbn = (res)->
  unless res?.source? then return
  { source } = res
  { results: [res], source: source }

searchByText = (query)->
  return promises = [
    searchWikidataEntities query
    .timeout 7000
    .then WrapResults('wd', query.search)
    # catching errors to avoid crashing promises_.all
    .catch _.Error('wikidata getBookEntities err')

    # searchOpenLibrary(query)
    # .timeout 7000
    # .then WrapResults('ol', query.search)

    booksData_.getDataFromText query.search
    .timeout 7000
    .then WrapResults('google', query.search)
    # catching errors to avoid crashing promises_.all
    .catch _.Error('getGoogleBooksDataFromText err')

    searchLocalEntities query
    .timeout 7000
    .then WrapResults('inv', query.search)

  ]

WrapResults = (source, search)-> (results)-> { results, source, search }

bundleResults = (sourcesResults)->
  resp = {}
  empty = true

  for sourceResults in _.compact(sourcesResults)
    { source, results, search } = sourceResults
    # also tests if the first item isnt undefined
    if _.isArray(results) and results[0]?
      resp[source] = sourceResults
      empty = false

    resp.search or= search

  if empty
    throw error_.new 'empty search result', 404

  return resp
