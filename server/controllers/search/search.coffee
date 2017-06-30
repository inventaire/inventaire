CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ host:elasticHost } = CONFIG.elasticsearch
{ formatError } = __.require 'lib', 'elasticsearch'
parseResults = require './lib/parse_results'
tailorResults = require './lib/tailor_results'
getIndexesAndTypes = require './lib/get_indexes_and_types'
queryBodyBuilder = require './lib/query_body_builder'
{ possibleTypes } = require './lib/types'

module.exports =
  get: (req, res)->
    { types, search, lang } = req.query

    _.info [ types, search ], 'entities local search'

    unless _.isNonEmptyString search
      return error_.bundleMissingQuery req, res, 'search'

    unless _.isNonEmptyString types
      return error_.bundleMissingQuery req, res, 'types'

    unless _.isNonEmptyString lang
      return error_.bundleMissingQuery req, res, 'lang'

    typesList = types.split '|'
    for type in typesList
      if type not in possibleTypes
        return error_.bundleInvalid req, res, 'type', type

    { indexes, types } = getIndexesAndTypes typesList

    url = "#{elasticHost}/#{indexes.join(',')}/#{types.join(',')}/_search"

    _.log url, 'global search'

    body = queryBodyBuilder search

    promises_.post { url, body }
    .catch formatError
    .then parseResults(types)
    .then tailorResults(lang)
    .then _.Wrap(res, 'results')
    .catch error_.Handler(req, res)
