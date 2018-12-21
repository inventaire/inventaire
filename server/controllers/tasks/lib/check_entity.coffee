CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
tasks_ = require './tasks'
buildTaskDocs = require './build_task_docs'
getNewTasks = require './get_new_tasks'
error_ = __.require 'lib', 'error/error'

module.exports = (uri)->
  getEntityByUri uri
  .then getTasksCandidates
  .then (tasksCandidates)->
    tasks_.bySuspectUris [ uri ]
    .then (existingTasks)->
      newTasks = getNewTasks tasksCandidates, existingTasks
      Promise.all [
        createTasks newTasks
        updateExistingTasks existingTasks, newTasks
      ]
      .then _.flatten

getTasksCandidates = (entity)->
  unless entity? then throw error_.notFound { uri }
  if entity.uri.split(':')[0] is 'wd'
    throw error_.new 'entity is already a redirection', 400, { uri }
  return buildTaskDocs entity

updateExistingTasks = (existingTasks, newTasks)->
  if newTasks.length is 0 or existingTasks.length is 0 then return Promise.resolve []
  { relationScore } = newTasks[0]
  tasks_.update
    ids: _.map existingTasks, '_id'
    attribute: 'relationScore'
    newValue: relationScore

createTasks = (newTasks)->
  Promise.all newTasks.map(tasks_.create)
  .then _.flatten
