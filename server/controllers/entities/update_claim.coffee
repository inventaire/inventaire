__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
require('./lib/update_claims_hooks')()

module.exports = (req, res)->
  { uri, property, 'old-value':oldVal, 'new-value': newVal } = req.body

  _.log req.body, 'update claim input'

  unless uri? then return error_.bundleMissingBody req, res, 'uri'
  unless property? then return error_.bundleMissingBody req, res, 'property'
  unless oldVal? or newVal?
    return error_.bundleMissingBody req, res, 'old-value|new-value'

  # An empty string is interpreted as a null value
  oldVal = parseEmptyValue oldVal
  newVal = parseEmptyValue newVal

  [ prefix, id ] = uri.split ':'
  updater = updaters[prefix]
  unless updater?
    return error_.bundle req, res, "unsupported uri prefix: #{prefix}", 400, uri

  updater req.user, id, property, oldVal, newVal
  .then _.Ok(res)
  .catch error_.Handler(req, res)

parseEmptyValue = (value)-> if value is '' then null else value

updaters =
  # TODO: accept ISBN URIs
  inv: require './update_inv_claim'
  wd: require './update_wd_claim'
