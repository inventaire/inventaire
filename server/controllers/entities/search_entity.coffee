CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
isbn_ = __.require 'lib', 'isbn/isbn'

searchByIsbn = require './search_by_isbn'
searchByText = require './search_by_text'

{ searchTimeout } = CONFIG

module.exports = (req, res)->
  { query } = req
  _.info query, 'entities search'

  { search, lang, filter, refresh } = query

  unless _.isNonEmptyString search
    return error_.bundle req, res, 'empty query' , 400

  unless lang?
    return error_.bundle req, res, 'no lang specified' , 400

  # make sure we have a 2 letters lang code
  query.lang = _.shortLang lang

  refresh = _.parseBooleanString refresh

  if isbn_.isIsbn search
    _.log search, 'searchByIsbn'
    promise = searchByIsbn search, refresh

  else
    _.log search, 'searchByText'
    promise = searchByText query, refresh

  promise
  .then spreadResults
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

spreadResults = (results)->
  response =
    humans: []
    books: []
    editions: []

  for result in results
    { type } = result
    switch type
      when 'book', 'human', 'edition' then response["#{type}s"].push result
      else _.warn result, "filtered-out type: #{type}"

  return response
