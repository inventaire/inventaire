CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
levelBase = require './base'
{ Promise } = __.require 'lib', 'promises'

module.exports =
  # always return an object with 'push' and 'pushBatch' function
  # taking a payload and returning a promise
  initQueue: (jobName, worker, maxConcurrency)->
    db = levelBase.rawSubDb "job:#{jobName}"

    if typeof CONFIG.jobs[jobName]?.run isnt 'boolean'
      throw new Error "unknown job: #{jobName}"

    # Push & run jobs to queue if this job is enabled in config
    if CONFIG.serverMode and CONFIG.jobs[jobName].run
      JobQueueServerAndClient = require 'level-jobs'
      _.info "#{jobName} job in server & client mode"
      depromisifiedWorker = workerDepromisifier worker
      return promisify JobQueueServerAndClient(db, depromisifiedWorker, maxConcurrency)

    # Otherwise, only push jobs to the queue, let another process run the jobs
    # See https://github.com/pgte/level-jobs#client-isolated-api
    # Typically used in prod to let the alt-instance run the jobs
    # and let the main instance focus on answering user requests
    else
      JobsQueueClient = require 'level-jobs/client'
      _.warn "#{jobName} job in client mode only"
      return promisify JobsQueueClient(db)

promisify = (API)->
  API.push = Promise.promisify API.push, { context: API }
  API.pushBatch = Promise.promisify API.pushBatch, { context: API }
  return API

workerDepromisifier = (workerFn)-> (jobId, payload, cb)->
  workerFn jobId, payload
  .then -> cb()
  .catch cb
