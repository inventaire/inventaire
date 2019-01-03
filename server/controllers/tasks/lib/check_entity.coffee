CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
tasks_ = require './tasks'
getNewTasks = require './get_new_tasks'
error_ = __.require 'lib', 'error/error'

module.exports = (uri)->
  getEntityByUri uri
  .then (entity)->
    unless entity? then throw error_.notFound { uri }

    if entity.uri.split(':')[0] is 'wd'
      throw error_.new 'entity is already a redirection', 400, { uri }

    getExistingTasks uri
    .then (existingTasks)->
      getNewTasks entity, existingTasks
      .then (newTasks)->
        Promise.all [
          createTasks newTasks
          updateExistingTasksRelationalScore existingTasks, newTasks
        ]
        .then _.flatten

updateExistingTasksRelationalScore = (existingTasks, newTasks)->
  if newTasks.length is 0 or existingTasks.length is 0 then return Promise.resolve []
  { relationScore } = newTasks[0]
  ids = _.map existingTasks, '_id'
  tasks_.update
    ids: ids
    attribute: 'relationScore'
    newValue: relationScore
  .then -> tasks_.byIds ids

createTasks = (newTasks)->
  Promise.all newTasks.map(tasks_.create)
  .then _.flatten

getExistingTasks = (uri)-> tasks_.bySuspectUris [ uri ]
