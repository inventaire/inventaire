__ = require('config').root
_ = __.require 'builders', 'utils'
entities_ = __.require 'lib', 'entities'

module.exports = (req, res, next) ->
  entityData = req.body
  _.log entityData, 'entityData at entities.create'
  entities_.create entityData
  .then res.json.bind(res)
  .catch _.errorHandler.bind _, res