__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res) ->
  { entity:entityId, property, value } = req.body
  { _id:userId } = req.user

  entities_.byId entityId
  .then _.Log('doc')
  .then (entityDoc)-> entities_.createClaim entityDoc, property, value, userId
  .then _.Ok(res)
  .catch error_.Handler(res)
