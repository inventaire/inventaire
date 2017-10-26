__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntitiesByUris = require './lib/get_entities_by_uris'

module.exports = (req, res, next)->
  { uris, refresh } = req.query
  # Accept URIs in a POST body
  uris or= req.body?.uris

  unless _.isNonEmptyString(uris) or _.isNonEmptyArray(uris)
    return error_.bundleMissingQuery req, res, 'uris'

  if _.isString uris then uris = uris.split '|'

  uris = _.uniq uris

  refresh = _.parseBooleanString refresh

  getEntitiesByUris uris, refresh
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
