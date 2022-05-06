const _ = require('builders/utils')
const tasks_ = require('./lib/tasks')
const db = require('db/couchdb/base')('entities')
const { prefixifyInv } = require('controllers/entities/lib/prefix')
const jobs_ = require('db/level/jobs')
const checkEntity = require('./lib/check_entity')
const { nice } = require('config')
const { waitForCPUsLoadToBeBelow } = require('lib/os')
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

  const addNextBatch = async () => {
    _.info(pagination, 'get entities next batch')
    const uris = await getNextInvHumanUrisBatch(pagination)
    pagination.total += uris.length
    if (uris.length === 0) {
      _.success(pagination.total, 'done. total entities queued:')
    } else {
      const filteredUris = await getFilteredUris(uris, refresh)
      await invTasksEntitiesQueue.pushBatch(filteredUris)
      return addNextBatch()
    }
  }

  return addNextBatch()
}

const getNextInvHumanUrisBatch = async pagination => {
  const { offset } = pagination
  const { rows } = await db.view('entities', 'byClaim', {
    key: [ 'wdt:P31', 'wd:Q5' ],
    limit: batchLength,
    skip: offset
  })
  pagination.offset += batchLength
  return getUris(rows)
}

const getFilteredUris = async (uris, refresh) => {
  if (refresh) return uris
  else return filterNotAlreadySuspectEntities(uris)
}

const getUris = rows => _.map(rows, 'id').map(prefixifyInv)

const deduplicateWorker = async (jobId, uri) => {
  try {
    // Run the worker when the CPUs activity is below 50% load
    // to give the priority to more urgent matters,
    // such as answering users requests
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 0.5 })
    await checkEntity(uri)
  } catch (err) {
    // Prevent crashing the queue for non-critical errors
    // Example of 400 error: the entity has already been redirected
    if (err.statusCode === 400) return
    _.error(err, 'deduplicateWorker err')
    throw err
  }
}

const filterNotAlreadySuspectEntities = async uris => {
  const { rows } = await tasks_.bySuspectUris(uris, { includeArchived: true })
  const alreadyCheckedUris = _.map(rows, 'suspectUri')
  return _.difference(uris, alreadyCheckedUris)
}

module.exports = { sanitization, controller }

const invTasksEntitiesQueue = jobs_.initQueue('inv:deduplicate', deduplicateWorker, 1)
