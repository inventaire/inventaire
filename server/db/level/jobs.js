const CONFIG = require('config')
const _ = require('builders/utils')
const getSubDb = require('./get_sub_db')
const { promisify } = require('util')

module.exports = {
  // always return an object with 'push' and 'pushBatch' function
  // taking a payload and returning a promise
  initQueue: (jobName, worker, maxConcurrency) => {
    const db = getSubDb(`job:${jobName}`, 'utf8')

    const run = CONFIG.jobs[jobName] && CONFIG.jobs[jobName].run
    if (typeof run !== 'boolean') {
      throw new Error(`unknown job: ${jobName}`)
    }

    // Push & run jobs to queue if this job is enabled in config
    if (CONFIG.serverMode && run) {
      const JobQueueServerAndClient = require('level-jobs')
      _.info(`${jobName} job in server & client mode`)
      const depromisifiedWorker = workerDepromisifier(worker)
      return promisifyApi(JobQueueServerAndClient(db, depromisifiedWorker, maxConcurrency))

    // Otherwise, only push jobs to the queue, let another process run the jobs
    // See https://github.com/pgte/level-jobs#client-isolated-api
    // Typically used in prod to let the alt-instance run the jobs
    // and let the main instance focus on answering user requests
    } else {
      const JobsQueueClient = require('level-jobs/client')
      _.warn(`${jobName} job in client mode only`)
      return promisifyApi(JobsQueueClient(db))
    }
  }
}

const promisifyApi = API => {
  // Binding context, see https://nodejs.org/api/util.html#util_util_promisify_original
  API.push = promisify(API.push).bind(API)
  API.pushBatch = promisify(API.pushBatch).bind(API)
  return API
}

const workerDepromisifier = workerFn => (jobId, payload, cb) => {
  return workerFn(jobId, payload)
  .then(() => cb())
  .catch(cb)
}
