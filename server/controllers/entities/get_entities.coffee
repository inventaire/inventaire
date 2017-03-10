__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntitiesByUris = require './lib/get_entities_by_uris'

module.exports = (req, res, next)->
  { uris, refresh } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = _.uniq uris.split('|')

  refresh = _.parseBooleanString refresh

  getEntitiesByUris uris, refresh
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
