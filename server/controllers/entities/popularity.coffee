__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntityPopularity = require './lib/get_entity_popularity'

module.exports = (req, res, next)->
  { uris, refresh } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = _.uniq uris.split('|')

  refresh = _.parseBooleanString refresh

  Promise.props uris.reduce(popularityByUri, {})
  .then _.Wrap(res, 'scores')
  .catch error_.Handler(req, res)

popularityByUri = (index, uri)->
  index[uri] = getEntityPopularity uri
  return index
