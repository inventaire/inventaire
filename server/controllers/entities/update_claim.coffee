__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'
radio = __.require 'lib', 'radio'

module.exports = (req, res)->
  { id:entityId, property, 'old-value':oldVal, 'new-value': newVal } = req.body
  { _id:userId, admin:userIsAdmin } = req.user

  _.log req.body, 'update claim input'

  # An empty string is interpreted as a null value
  oldVal = parseEmptyValue oldVal
  newVal = parseEmptyValue newVal

  entities_.byId entityId
  .then (currentDoc)->
    entities_.updateClaim { property, oldVal, newVal, userId, currentDoc, userIsAdmin }
  .tap _.Ok(res)
  .then (updatedDoc)->
    radio.emit 'entity:update:claim', updatedDoc, property, oldVal, newVal
  .catch error_.Handler(req, res)

parseEmptyValue = (value)-> if value is '' then null else value
