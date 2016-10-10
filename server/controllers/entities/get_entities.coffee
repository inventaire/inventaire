__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntitiesByUris = require './lib/get_entities_by_uris'

module.exports = (req, res, next)->
  { uris } = req.query

  unless _.isNonEmptyString uris
    return error_.bundle req, res, "missing uris parameter", 400, req.query

  getEntitiesByUris uris.split('|')
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
