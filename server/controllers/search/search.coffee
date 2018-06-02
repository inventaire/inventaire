CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ host:elasticHost } = CONFIG.elasticsearch
{ formatError } = __.require 'lib', 'elasticsearch'
parseResults = require './lib/parse_results'
normalizeResults = require './lib/normalize_results'
boostByPopularity = require './lib/boost_by_popularity'
getIndexesAndTypes = require './lib/get_indexes_and_types'
queryBodyBuilder = require './lib/query_body_builder'
{ possibleTypes } = require './lib/types'

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

    { indexes, types } = getIndexesAndTypes typesList

    url = "#{elasticHost}/#{indexes.join(',')}/#{types.join(',')}/_search"

    # Fetch 20 results to give the opportunity to results with a higher popularity
    # but a lower lexical score to make it to the 10 results returned
    body = queryBodyBuilder search, limit + 20

    promises_.post { url, body }
    .catch formatError
    .then parseResults(types, reqUserId)
    .then normalizeResults(lang)
    .then boostByPopularity
    .then (results)-> results.slice 0, limit
    .then _.Wrap(res, 'results')
    .catch error_.Handler(req, res)
