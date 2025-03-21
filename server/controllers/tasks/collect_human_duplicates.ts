import { difference, map } from 'lodash-es'
import { prefixifyInv } from '#controllers/entities/lib/prefix'
import { getTasksBySuspectUris } from '#controllers/tasks/lib/tasks'
import { dbFactory } from '#db/couchdb/base'
import { initJobQueue } from '#db/level/jobs'
import { waitForCPUsLoadToBeBelow } from '#lib/os'
import { success, info, logError, LogError } from '#lib/utils/logs'
import config, { federatedMode } from '#server/config'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import checkHumanDuplicate from './lib/check_human_duplicate.js'

const { nice } = config

const db = await dbFactory('entities')
const batchLength = 1000

const sanitization = {
  refresh: { optional: true },
}

async function controller ({ refresh }: SanitizedParameters) {
  addEntitiesToQueueSequentially(refresh)
  .catch(LogError('addEntitiesToQueueSequentially err'))

  // Not waiting for the queue to be loaded as that will take a while
  // and no useful data has to be returned
  return { ok: true }
}

function addEntitiesToQueueSequentially (refresh) {
  const pagination = { offset: 0, total: 0 }

  async function addNextBatch () {
    info(pagination, 'get entities next batch')
    const uris = await getNextInvHumanUrisBatch(pagination)
    pagination.total += uris.length
    if (uris.length === 0) {
      success(pagination.total, 'Done. Total entities queued:')
    } else {
      const filteredUris = await getFilteredUris(uris, refresh)
      await invTasksEntitiesQueue.pushBatch(filteredUris)
      return addNextBatch()
    }
  }

  return addNextBatch()
}

async function getNextInvHumanUrisBatch (pagination) {
  const { offset } = pagination
  const { rows } = await db.view('entities', 'byClaim', {
    key: [ 'wdt:P31', 'wd:Q5' ],
    limit: batchLength,
    skip: offset,
  })
  pagination.offset += batchLength
  return getUris(rows)
}

async function getFilteredUris (uris, refresh) {
  if (refresh) return uris
  else return filterNotAlreadySuspectEntities(uris)
}

const getUris = rows => map(rows, 'id').map(prefixifyInv)

async function deduplicateWorker (jobId, uri) {
  try {
    // Run the worker when the CPUs activity is below 50% load
    // to give the priority to more urgent matters,
    // such as answering users requests
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 0.5 })
    await checkHumanDuplicate(uri)
  } catch (err) {
    // Prevent crashing the queue for non-critical errors
    // Example of 400 error: the entity has already been redirected
    if (err.statusCode === 400) return
    logError(err, 'deduplicateWorker err')
    throw err
  }
}

async function filterNotAlreadySuspectEntities (uris) {
  const tasks = await getTasksBySuspectUris(uris, { includeArchived: true })
  const alreadyCheckedUris = map(tasks, 'suspectUri')
  return difference(uris, alreadyCheckedUris)
}

export default { sanitization, controller }

let invTasksEntitiesQueue
if (!federatedMode) {
  invTasksEntitiesQueue = initJobQueue('inv:deduplicate', deduplicateWorker, 1)
}
