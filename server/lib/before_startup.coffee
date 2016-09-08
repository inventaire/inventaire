CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ execFile } = require 'child_process'
{ red } = require 'chalk'
archiveLogsScript = __.path 'scripts', 'archive_logs'

module.exports = ->
  initUncaughtExceptionCatcher()
  archiveLogs()

archiveLogs = ->
  execFile archiveLogsScript, (err, res)->
    if err then _.error err, 'archive logs error'
    else _.info 'logs archived'

initUncaughtExceptionCatcher = ->
  process.on 'uncaughtException', (err)->
    console.error red('uncaughtException'), err, err.stack
