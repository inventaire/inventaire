CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
isbn_ = __.require 'lib', 'isbn/isbn'

searchByIsbn = require './lib/search_by_isbn'
searchByText = require './lib/search_by_text'

{ searchTimeout } = CONFIG

module.exports = (req, res)->
  { query } = req
  _.info query, 'entities search'

  { search, lang } = query

  unless _.isNonEmptyString search
    return error_.bundle req, res, 'empty query' , 400

  unless lang?
    return error_.bundle req, res, 'no lang specified' , 400

  # Make sure we have a 2 letters lang code
  query.lang = _.shortLang lang
  query.refresh = _.parseBooleanString query.refresh

  if isbn_.looksLikeAnIsbn search
    unless isbn_.isValidIsbn search
      return error_.bundle req, res, 'invalid isbn' , 400

    _.log search, 'searchByIsbn'
    promise = searchByIsbn { isbn: search, refresh: query.refresh }

  else
    _.log search, 'searchByText'
    promise = searchByText query

  promise
  .then spreadResults
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

spreadResults = (results)->
  response =
    humans: []
    series: []
    works: []
    editions: []

  for result in results
    { type } = result
    if type in whitelistedTypes then response["#{type}s"].push result

  return response

whitelistedTypes = [ 'human', 'serie', 'work', 'edition' ]
