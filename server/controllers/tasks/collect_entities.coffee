CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'
entities_ = __.require 'controllers', 'entities/lib/entities'
promises_ = __.require 'lib', 'promises'
responses_ = __.require 'lib', 'responses'
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
jobs_ = __.require 'level', 'jobs'
checkEntity = require './lib/check_entity'
{ interval } = CONFIG.jobs['inv:deduplicate']
batchLength = 1000

module.exports = (req, res)->
  refresh = _.parseBooleanString req.query.refresh
  addEntitiesToQueueSequentially refresh
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)

addEntitiesToQueueSequentially = (refresh)->
  pagination = { offset: 0, total: 0 }

  addNextBatch = ->
    _.info pagination, 'get entities next batch'
    getNextInvHumanUrisBatch pagination
    .then (uris)->
      pagination.total += uris.length
      if uris.length is 0 then return _.success pagination.total, 'done. total entities queued:'
      getFilteredUris uris, refresh
      .then invTasksEntitiesQueue.pushBatch
      .then addNextBatch

  return addNextBatch()

getNextInvHumanUrisBatch = (pagination)->
  { offset } = pagination
  entities_.db.view 'entities', 'byClaim',
    key: [ 'wdt:P31', 'wd:Q5' ]
    limit: batchLength
    skip: offset
  .tap -> pagination.offset += batchLength
  .then getUris

getFilteredUris = (uris, refresh)->
  if refresh then promises_.resolve uris
  else filterNotAlreadySuspectEntities uris

getUris = (res)-> _.map(res.rows, 'id').map prefixifyInv

deduplicateWorker = (jobId, uri)->
  checkEntity uri
  .delay interval
  .catch (err)->
    if err.statusCode is 400 then return
    else
      _.error err, 'deduplicateWorker err'
      throw err

filterNotAlreadySuspectEntities = (uris)->
  tasks_.bySuspectUris uris, { includeArchived: true }
  .then (res)->
    alreadyCheckedUris = _.map res.rows, 'suspectUri'
    return _.difference uris, alreadyCheckedUris

invTasksEntitiesQueue = jobs_.initQueue 'inv:deduplicate', deduplicateWorker, 1
