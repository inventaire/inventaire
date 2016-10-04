CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'
booksData_ = __.require 'lib', 'books_data'
wikidata_ = __.require 'lib', 'wikidata'

searchWikidataEntities = __.require 'data', 'wikidata/entities'
searchLocalEntities = require './search_local'
getWikidataBookEntitiesByIsbn = __.require 'data', 'wikidata/books_by_isbn'
searchDataseed = __.require 'data', 'dataseed/search'
filteredSearch = require './filtered_search'

{ searchTimeout } = CONFIG

module.exports = (req, res)->
  { query } = req
  { search, lang, filter } = query
  _.info query, 'entities search'

  unless _.isNonEmptyString search
    return error_.bundle req, res, 'empty query' , 400

  unless lang?
    return error_.bundle req, res, 'no lang specified' , 400

  # make sure we have a 2 letters lang code
  query.lang = _.shortLang lang

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
    getWikidataBookEntitiesByIsbn isbn, isbnType, query.lang
    .timeout searchTimeout
    .catch _.Error('getWikidataBookEntitiesByIsbn')

    getBooksDataFromIsbn cleanedIsbn
    .timeout searchTimeout
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
    .timeout searchTimeout
    .then WrapResults('wd', query.search)
    # catching errors to avoid crashing promises_.all
    .catch _.Error('wikidata getBookEntities err')

    searchLocalEntities query
    .timeout searchTimeout
    .then WrapResults('inv', query.search)
    .catch _.Error('searchLocalEntities err')

    searchDataseed query
    .timeout searchTimeout
    .then WrapResults('dataseed', query.search)
    .catch _.Error('searchDataseed err')
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
