__ = require('config').universalPath
_ = __.require 'builders', 'utils'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
radio = __.require 'lib', 'radio'

archiveObsoleteEntityUriTasks = (uri)->
  tasks_.bySuspectUri uri
  .then (tasks)->
    ids = _.map tasks, '_id'
    tasks_.update { ids, attribute: 'state', newValue: 'merged' }

module.exports = ->
  radio.on 'entity:merge', archiveObsoleteEntityUriTasks
  radio.on 'entity:remove', archiveObsoleteEntityUriTasks
  # TODO: revert archiveObsoleteEntityUriTasks on revert-merge
