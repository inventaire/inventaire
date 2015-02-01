__ = require('config').root
_ = __.require 'builders', 'utils'
entities_ = __.require 'lib', 'entities'

module.exports = (req, res, next) ->
  entityData = req.body
  unless _.typeOf(entityData) is 'object'
    return _.errorHandler res, 'bad query', 400

  entities_.create entityData
  .then res.json.bind(res)
  .catch _.errorHandler.bind _, res