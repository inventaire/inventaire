__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
searchEntity = require './search_entity'
getImages = require './get_images'
getIsbns = require './get_isbns'
getEntities = require './get_entities'
createEntity = require './create_entity'

module.exports =
  # public
  actions: (req, res, next) ->
    action = req.query.action
    unless action? then return error_.bundle res, 'bad query', 400

    switch action
      when 'search' then return searchEntity req, res
      when 'get-images' then return getImages req, res
      when 'get-inv-entities' then return getEntities req, res
      when 'get-isbn-entities' then return getIsbns req, res
      else error_.unknownAction res

  # authentified
  create: createEntity
