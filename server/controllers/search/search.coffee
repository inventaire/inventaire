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
Group = __.require 'models', 'group'

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
      # Extend the search to the next 10 results, so that the popularity boost
      # can save some good results a bit further down the limit
      typeSearch types, search, limit + 10
      .then parseResults(types)
      .filter isSearchable(reqUserId)
      .then normalizeResults(lang)
      .then boostByPopularity
      .then (results)-> results.slice 0, limit
    .then responses_.Wrap(res, 'results')
    .catch error_.Handler(req, res)

isSearchable = (reqUserId)-> (result)->
  if result._type isnt 'groups' then return true
  if result._source.searchable then return true
  unless reqUserId? then return false
  # Only members should be allowed to find non-searchable groups in search
  return Group.userIsMember reqUserId, result._source
