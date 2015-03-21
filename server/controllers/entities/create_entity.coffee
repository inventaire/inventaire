__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'lib', 'entities'

module.exports = (req, res, next) ->
  entityData = req.body
  unless _.typeOf(entityData) is 'object'
    return error_.bundle res, 'bad query', 400

  entities_.create entityData
  .then res.json.bind(res)
  .catch error_.Handler(res)