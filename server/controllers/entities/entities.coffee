__ = require('config').root
_ = __.require 'builders', 'utils'

searchEntity = require './search_entity'
getImages = require './get_images'
getIsbns = require './get_isbns'
createEntity = require './create_entity'

module.exports =
  # public
  actions: (req, res, next) ->
    action = req.query.action
    unless action? then return _.errorHandler res, 'bad query', 400

    switch action
      when 'search' then return searchEntity(req, res)
      when 'getimages' then return getImages(req, res)
      when 'getisbnentities' then return getIsbns(req, res)
      else _.errorHandler res, 'entities action not found', 400

  # authentified
  create: createEntity
