__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res, next)->
  { property, value } = req.query

  entities_.idsByClaim property, value
  .then _.Log('ENTITIES IDS BY CLAIM')
  .then _.Wrap(res, 'ids')
  .catch error_.Handler(req, res)
