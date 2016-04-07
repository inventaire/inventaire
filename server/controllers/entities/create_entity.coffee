__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res) ->
  { body:entityData } = req
  unless _.typeOf(entityData) is 'object'
    return error_.bundle res, 'bad query', 400

  { _id:userId } = req.user

  entities_.create entityData, userId
  .then res.json.bind(res)
  .catch error_.Handler(res)