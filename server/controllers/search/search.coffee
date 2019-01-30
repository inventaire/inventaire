CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
parseResults = require './lib/parse_results'
normalizeResults = require './lib/normalize_results'
boostByPopularity = require './lib/boost_by_popularity'
{ possibleTypes } = require './lib/types'
typeSearch = require './lib/type_search'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  search: {}
  lang: {}
  types: { whitelist: possibleTypes }
  limit: { default: 10, max: 100 }

module.exports =
  get: (req, res)->
    sanitize req, res, sanitization
    .then (params)->
      { types, search, lang, limit, reqUserId } = params
      typeSearch types, search
      .then parseResults(types, reqUserId)
      .then normalizeResults(lang)
      .then boostByPopularity
      .then (results)-> results.slice 0, limit
    .then responses_.Wrap(res, 'results')
    .catch error_.Handler(req, res)
