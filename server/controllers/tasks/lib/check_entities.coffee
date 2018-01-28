__ = require('config').universalPath
_ = __.require 'builders', 'utils'

checkEntity = require './check_entity'

module.exports = (entities)->
  newTasks = []

  checkNextEntity = ->
    entity = entities.pop()
    unless entity? then return newTasks

    checkEntity entity
    .then (suggestionEntities)->
      for suggestionEntity in suggestionEntities
        unless suggestionEntity.uri? then return {}
        newTasks.push
          type: 'deduplicate'
          suspectUri: "inv:#{entity._id}"
          suggestionUri: suggestionEntity.uri
          state: 'requested'
          elasticScore: suggestionEntity._score
    .then checkNextEntity

  return checkNextEntity()
