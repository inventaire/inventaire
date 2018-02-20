CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
parseResults = require './lib/parse_results'
tailorResults = require './lib/tailor_results'
{ possibleTypes } = require './lib/types'
typeSearch = require './lib/type_search'

module.exports =
  get: (req, res)->
    { types, search, lang } = req.query
    reqUserId = req.user?._id

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

    typeSearch typesList, search
    .then parseResults(types, reqUserId)
    .then tailorResults(lang)
    .then _.Wrap(res, 'results')
    .catch error_.Handler(req, res)
