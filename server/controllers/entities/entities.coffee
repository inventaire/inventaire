__ = require('config').root
_ = __.require 'builders', 'utils'

getImages = require './get_images'
searchEntity = require './search_entity'

entities_ = __.require 'lib', 'entities'

module.exports =
  actions: (req, res, next) ->
    action = req.query.action
    unless action? then return _.errorHandler res, 'bad query', 400

    switch action
      when 'search' then return searchEntity(req, res)
      when 'getimages' then return getImages(req, res)
      else _.errorHandler res, 'entities action not found', 400

  create: (req, res, next) ->
    entityData = req.body
    _.log entityData, 'entityData at entities.create'
    entities_.create entityData
    .then (entity)-> res.json entity
    .catch _.errorHandler.bind _, res