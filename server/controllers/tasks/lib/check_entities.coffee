__ = require('config').universalPath
_ = __.require 'builders', 'utils'

checkEntity = require './check_entity'

module.exports = (entities)->
  entitiesList = _.values(entities)
  newTasks = []

  checkNextEntity = ->
    entity = entitiesList.pop()
    unless entity? then return newTasks

    checkEntity entity
    .then (suggestionEntities)->
      for suggestionEntity in suggestionEntities
        newTasks.push
          type: 'deduplicate'
          suspectUri: entity.uri
          suggestionUri: suggestionEntity.uri
          state: 'requested'
    .then checkNextEntity

  return checkNextEntity()
