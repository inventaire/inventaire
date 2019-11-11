__ = require('config').universalPath
_ = __.require 'builders', 'utils'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
radio = __.require 'lib', 'radio'
checkEntity = require './lib/check_entity'

# TODO:
# - revert archiveObsoleteEntityUriTasks on revert-merge
module.exports = ->
  radio.on 'entity:merge', archiveObsoleteEntityUriTasks
  radio.on 'entity:remove', archiveObsoleteEntityUriTasks
  radio.on 'wikidata:entity:redirect', deleteBySuggestionUriAndRecheckSuspects

archiveObsoleteEntityUriTasks = (uri)->
  tasks_.bySuspectUri uri
  .then archiveTasks

deleteBySuggestionUriAndRecheckSuspects = (previousSuggestionUri, newSuggestionUri)->
  tasks_.bySuggestionUri previousSuggestionUri
  .tap tasks_.bulkDelete
  # Re-check entities after having archived obsolete tasks so that relationScores
  # are updated once every doc is in place.
  # No need to do anything with the newSuggestionUri as checkEntity should find it
  # if it is relevant
  .map (task)-> checkEntity task.suspectUri

archiveTasks = (tasks)->
  if tasks.length is 0 then return
  ids = _.map tasks, '_id'
  tasks_.update { ids, attribute: 'state', newValue: 'merged' }
