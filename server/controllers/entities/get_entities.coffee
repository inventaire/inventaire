__ = require('config').root
_ = __.require 'builders', 'utils'
entities_ = __.require 'lib', 'entities'

module.exports = (req, res, next)->
  _.log ids = req.query.ids, 'getEntities ids'
  entities_.getEntities(ids)
  .then extractId.bind null, res
  .catch _.errorHandler.bind(_, res)

extractId = (res, entities)->
  _.log entities, 'entities'
  index = {}
  entities.forEach (entity)->
    {_id} = entity
    index[_id] = entity
  _.log index, 'index'
  res.send index