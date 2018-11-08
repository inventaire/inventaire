CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'controllers', 'entities/lib/entities'
responses_ = __.require 'lib', 'responses'
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
jobs_ = __.require 'level', 'jobs'
checkEntity = require './lib/check_entity'
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
  .then (res)-> _.map(res.rows, 'id').map prefixifyInv

deduplicateWorker = (jobId, uri)->
  checkEntity uri
  .delay interval
  .catch (err)->
    if err.statusCode is 400 then return
    else
      _.error err, 'deduplicateWorker err'
      throw err

invTasksEntitiesQueue = jobs_.initQueue 'inv:deduplicate', deduplicateWorker, 1
