import { promisify } from 'node:util'
import JobQueueServerAndClient from 'level-jobs'
import JobsQueueClient from 'level-jobs/client.js'
import { getKeys } from '#db/level/utils'
import { serverMode } from '#lib/server_mode'
import { oneMinute } from '#lib/time'
import { warn, info } from '#lib/utils/logs'
import config from '#server/config'
import { leveldbFactory, type CustomLevelDb } from './get_sub_db.js'

const levelJobsOptions = {
  maxRetries: 20,
  backoff: {
    randomisationFactor: 0,
    initialDelay: 1000,
    maxDelay: 60000,
  },
}

type Worker = (jobId: string, payload: unknown) => Promise<void>

// always return an object with 'push' and 'pushBatch' function
// taking a payload and returning a promise
export function initJobQueue (jobName: string, worker: Worker, maxConcurrency: number) {
  const db = leveldbFactory(`job:${jobName}`, 'utf8')

  const run = config.jobs[jobName] && config.jobs[jobName].run
  if (typeof run !== 'boolean') {
    throw new Error(`unknown job: ${jobName}`)
  }

  // Push & run jobs to queue if this job is enabled in config
  if (serverMode && run) {
    info(`${jobName} job in server & client mode`)
    const depromisifiedWorker = workerDepromisifier(worker)
    const queue = JobQueueServerAndClient(db, depromisifiedWorker, { maxConcurrency, ...levelJobsOptions })
    keepWorkerAwake(queue)
    return promisifyApi(queue, db)

  // Otherwise, only push jobs to the queue, let another process run the jobs
  // See https://github.com/pgte/level-jobs#client-isolated-api
  // Typically used in prod to let the alt-instance run the jobs
  // and let the main instance focus on answering user requests
  } else {
    warn(`${jobName} job in client mode only`)
    return promisifyApi(JobsQueueClient(db), db)
  }
}

function promisifyApi (queue, db: CustomLevelDb) {
  // Binding context, see https://nodejs.org/api/util.html#util_util_promisify_original
  queue.push = promisify(queue.push).bind(queue)
  queue.pushBatch = promisify(queue.pushBatch).bind(queue)
  queue.getQueueLength = getQueueLength.bind(null, db)
  queue.clearQueue = clearQueue.bind(null, db)
  return queue
}

const workerDepromisifier = (workerFn: Worker) => (jobId, payload, cb) => {
  return workerFn(jobId, payload)
  .then(() => cb())
  .catch(cb)
}

// level-jobs relies on level-hooks, which awakes the worker queue after put/del/batch ops,
// but can not do it when those ops are called from another process (typically when
// several process bind to the same leveldb via level-party). Thus the need to force
// the queue awakening, by making a dummy op that will restart the queue, giving
// a chance to jobs pushed by queue-client processes to be worked on, despite
// the absence of new jobs on from the queue-server process
function keepWorkerAwake (queue) {
  setInterval(() => {
    queue._work.del('fakekey')
  }, oneMinute)
}

async function getQueueLength (db: CustomLevelDb) {
  const keys = await getKeys(db)
  return keys.length
}

async function clearQueue (db: CustomLevelDb) {
  const keys = await getKeys(db)
  if (keys.length > 0) warn(keys, 'clearning job queue')
  await db.batch(keys.map(key => ({ key, type: 'del' })))
}
