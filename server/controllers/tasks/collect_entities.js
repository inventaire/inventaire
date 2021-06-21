const _ = require('builders/utils')
const { tap } = require('lib/promises')
const tasks_ = require('./lib/tasks')
const db = require('db/couchdb/base')('entities')
const { Wait } = require('lib/promises')
const { prefixifyInv } = require('controllers/entities/lib/prefix')
const jobs_ = require('db/level/jobs')
const checkEntity = require('./lib/check_entity')
const { interval } = require('config').jobs['inv:deduplicate']
const batchLength = 1000

const sanitization = {
  refresh: { optional: true }
}

const controller = async ({ refresh }) => {
  addEntitiesToQueueSequentially(refresh)
  .catch(_.Error('addEntitiesToQueueSequentially err'))

  // Not waiting for the queue to be loaded as that will take a while
  // and no useful data has to be returned
  return { ok: true }
}

const addEntitiesToQueueSequentially = refresh => {
  const pagination = { offset: 0, total: 0 }

  const addNextBatch = () => {
    _.info(pagination, 'get entities next batch')
    return getNextInvHumanUrisBatch(pagination)
    .then(uris => {
      pagination.total += uris.length
      if (uris.length === 0) return _.success(pagination.total, 'done. total entities queued:')
      return getFilteredUris(uris, refresh)
      .then(invTasksEntitiesQueue.pushBatch)
      .then(addNextBatch)
    })
  }

  return addNextBatch()
}

const getNextInvHumanUrisBatch = pagination => {
  const { offset } = pagination
  return db.view('entities', 'byClaim', {
    key: [ 'wdt:P31', 'wd:Q5' ],
    limit: batchLength,
    skip: offset
  })
  .then(tap(() => { pagination.offset += batchLength }))
  .then(getUris)
}

const getFilteredUris = async (uris, refresh) => {
  if (refresh) return uris
  else return filterNotAlreadySuspectEntities(uris)
}

const getUris = res => _.map(res.rows, 'id').map(prefixifyInv)

const deduplicateWorker = (jobId, uri) => {
  return checkEntity(uri)
  .then(Wait(interval))
  .catch(err => {
    // Prevent crashing the queue for non-critical errors
    // Example of 400 error: the entity has already been redirected
    if (err.statusCode === 400) return
    _.error(err, 'deduplicateWorker err')
    throw err
  })
}

const filterNotAlreadySuspectEntities = uris => {
  return tasks_.bySuspectUris(uris, { includeArchived: true })
  .then(res => {
    const alreadyCheckedUris = _.map(res.rows, 'suspectUri')
    return _.difference(uris, alreadyCheckedUris)
  })
}

module.exports = { sanitization, controller }

const invTasksEntitiesQueue = jobs_.initQueue('inv:deduplicate', deduplicateWorker, 1)
