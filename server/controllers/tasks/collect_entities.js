// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const tasks_ = require('./lib/tasks')
const entities_ = __.require('controllers', 'entities/lib/entities')
const promises_ = __.require('lib', 'promises')
const responses_ = __.require('lib', 'responses')
const { prefixifyInv } = __.require('controllers', 'entities/lib/prefix')
const jobs_ = __.require('level', 'jobs')
const checkEntity = require('./lib/check_entity')
const { interval } = CONFIG.jobs['inv:deduplicate']
const batchLength = 1000

module.exports = function(req, res){
  const refresh = _.parseBooleanString(req.query.refresh)

  addEntitiesToQueueSequentially(refresh)
  .catch(_.Error('addEntitiesToQueueSequentially err'))

  // Not waiting for the queue to be loaded as that will take a while
  // and no useful data has to be returned
  return responses_.ok(res)
}

var addEntitiesToQueueSequentially = function(refresh){
  const pagination = { offset: 0, total: 0 }

  var addNextBatch = function() {
    _.info(pagination, 'get entities next batch')
    return getNextInvHumanUrisBatch(pagination)
    .then((uris) => {
      pagination.total += uris.length
      if (uris.length === 0) { return _.success(pagination.total, 'done. total entities queued:') }
      return getFilteredUris(uris, refresh)
      .then(invTasksEntitiesQueue.pushBatch)
      .then(addNextBatch)
    })
  }

  return addNextBatch()
}

var getNextInvHumanUrisBatch = function(pagination){
  const { offset } = pagination
  return entities_.db.view('entities', 'byClaim', {
    key: [ 'wdt:P31', 'wd:Q5' ],
    limit: batchLength,
    skip: offset
  }).tap(() => pagination.offset += batchLength)
  .then(getUris)
}

var getFilteredUris = function(uris, refresh){
  if (refresh) { return promises_.resolve(uris)
  } else { return filterNotAlreadySuspectEntities(uris) }
}

var getUris = res => _.map(res.rows, 'id').map(prefixifyInv)

const deduplicateWorker = (jobId, uri) => checkEntity(uri)
.delay(interval)
.catch((err) => {
  if (err.statusCode === 400) { return
  } else {
    _.error(err, 'deduplicateWorker err')
    throw err
  }
})

var filterNotAlreadySuspectEntities = uris => tasks_.bySuspectUris(uris, { includeArchived: true })
.then((res) => {
  const alreadyCheckedUris = _.map(res.rows, 'suspectUri')
  return _.difference(uris, alreadyCheckedUris)
})

var invTasksEntitiesQueue = jobs_.initQueue('inv:deduplicate', deduplicateWorker, 1)
