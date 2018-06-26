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
  refresh = _.parseBooleanString req.query.refresh
  addEntitiesToQueue refresh
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)

addEntitiesToQueue = (refresh) ->
  getInvHumanUris()
  .then (uris)->
    if refresh then uris
    else filterNotAlreadySuspectEntities(uris)
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

filterNotAlreadySuspectEntities = (uris)->
  tasks_.bySuspectUris uris
  .then (res)->
    alreadyCheckedUris = _.pluck res.rows, 'suspectUri'
    return _.difference uris, alreadyCheckedUris

invTasksEntitiesQueue = jobs_.initQueue 'inv:deduplicate', deduplicateWorker, 1
