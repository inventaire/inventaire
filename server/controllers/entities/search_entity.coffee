CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
isbn_ = __.require 'lib', 'isbn/isbn'

searchByIsbn = require './search_by_isbn'
searchByText = require './search_by_text'
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

  if isbn_.isIsbn search
    _.log search, 'searchByIsbn'
    promises = searchByIsbn query

  else
    _.log search, 'searchByText'
    promises = searchByText query

  promises_.all promises
  .then bundleResults
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

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
