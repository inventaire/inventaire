CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Jobs = require 'level-jobs'
levelBase = require './base'

module.exports =
  getQueue: (jobName, worker, maxConcurrency)->
    _.types arguments, [ 'string', 'function', 'number' ]
    db = levelBase.sub "job:#{jobName}"
    return Jobs db, worker, maxConcurrency
