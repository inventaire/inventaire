CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
entities_ = __.require 'controllers', 'entities/lib/entities'
responses_ = __.require 'lib', 'responses'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
createTaskDocs = __.require 'controllers', 'tasks/lib/create_task_docs'
jobs_ = __.require 'level', 'jobs'
{ mapDoc } = __.require 'lib', 'couch'
{ interval } = CONFIG.jobs['inv:deduplicate']

module.exports = (req, res)->
  addEntitiesToQueue()
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)

addEntitiesToQueue = ->
  getInvHumanUris()
  .then invTasksEntitiesQueue.pushBatch
  .catch _.ErrorRethrow('addEntitiesToQueue err')

getInvHumanUris = ->
  entities_.byClaim 'wdt:P31', 'wd:Q5'
  .then (res)-> _.pluck(res.rows, 'id').map prefixify

deduplicateWorker = (jobId, uri, cb)->
  getEntityByUri uri
  .then (entity)->
    unless entity? then throw error_.notFound { uri }
    createTaskDocs entity
  .then tasks_.keepNewTasks
  .map tasks_.create
  .delay interval
  .catch _.ErrorRethrow('deduplicateWorker err')

prefixify = (id)-> "inv:#{id}"

invTasksEntitiesQueue = jobs_.initQueue 'inv:deduplicate', deduplicateWorker, 1
