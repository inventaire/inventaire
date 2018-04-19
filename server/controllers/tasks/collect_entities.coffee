__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
entities_ = __.require 'controllers', 'entities/lib/entities'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
createTaskDocs = __.require 'controllers', 'tasks/lib/create_task_docs'
jobs_ = __.require 'level', 'jobs'
{ mapDoc } = __.require 'lib', 'couch'

module.exports = (req, res)->
  addEntitiesToQueue()
  .then _.Ok(res)
  .catch error_.Handler(req, res)

addEntitiesToQueue = ->
  getInvHumanUris()
  .then (invHumanUris)->
    invTasksEntitiesQueue.pushBatch invHumanUris, errorLogger

    return promises_.resolve null

errorLogger = (err)->
  if err? then _.error err, 'invTasksEntitiesQueue.push err'

getInvHumanUris = ->
  entities_.db.view 'entities', 'byClaim',
    key: [ 'wdt:P31', 'wd:Q5' ]
    limit: 10000
  .then (res)-> _.pluck(res.rows, 'id').map prefixify

deduplicateWorker = (jobId, uri, cb)->
  getEntityByUri uri
  .then (entity)-> createTaskDocs [entity]
  .then tasks_.keepNewTasks
  .map tasks_.create
  # .delay 5000
  .then -> cb()
  .catch (err)->
    _.error err, 'deduplicateWorker err'
    cb err

prefixify = (id)-> "inv:#{id}"

invTasksEntitiesQueue = jobs_.initQueue 'inv:deduplicate', deduplicateWorker, 1
