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

module.exports =
  get: (req, res)->
    { types, search, lang, limit } = req.query
    reqUserId = req.user?._id

    unless _.isNonEmptyString search
      return error_.bundleMissingQuery req, res, 'search'

    unless _.isNonEmptyString types
      return error_.bundleMissingQuery req, res, 'types'

    unless _.isNonEmptyString lang
      return error_.bundleMissingQuery req, res, 'lang'

    limit or= '10'

    unless _.isPositiveIntegerString limit
      return error_.bundleInvalid req, res, 'limit', limit

    limit = _.stringToInt limit

    typesList = types.split '|'
    for type in typesList
      if type not in possibleTypes
        return error_.bundleInvalid req, res, 'type', type

    typeSearch typesList, search
    .then parseResults(types, reqUserId)
    .then normalizeResults(lang)
    .then boostByPopularity
    .then (results)-> results.slice 0, limit
    .then responses_.Wrap(res, 'results')
    .catch error_.Handler(req, res)
