__ = require('config').universalPath
_ = __.require 'builders', 'utils'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
radio = __.require 'lib', 'radio'

updateTasksStateOnEntityMerge = (fromUri, toUri)->
  tasks_.bySuspectUri fromUri
  .then (tasks)->
    ids = _.pluck tasks, '_id'
    tasks_.update { ids, attribute: 'state', newValue: 'merged' }

module.exports = ->
  radio.on 'entity:merge', updateTasksStateOnEntityMerge
