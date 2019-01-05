__ = require('config').universalPath
_ = __.require 'builders', 'utils'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
getEntitiesByUris = require './lib/get_entities_by_uris'
addRelatives = require './lib/add_relatives'

validRelativesProperties = [
  'wdt:P50'
  'wdt:P179'
  'wdt:P629'
]

sanitization =
  uris: {}
  refresh: { optional: true }
  relatives:
    whitelist: validRelativesProperties
    optional: true

module.exports = (req, res, next)->
  sanitize req, res, sanitization
  .then (params)->
    { uris, refresh, relatives } = params
    getEntitiesByUris { uris, refresh }
    .then addRelatives(relatives, refresh)
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
