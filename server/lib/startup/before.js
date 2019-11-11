CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
# Needs to be run before the first promise is fired
# so that the configuration applies to all
{ Promise } = __.require 'lib', 'promises'

{ red } = require 'chalk'

module.exports = ->
  initUncaughtExceptionCatcher()

  _.logErrorsCount()
  _.log "pid: #{process.pid}"
  _.log "env: #{CONFIG.env}"
  _.log "host: #{CONFIG.fullHost()}"

initUncaughtExceptionCatcher = ->
  process.on 'uncaughtException', (err)-> console.error red('uncaughtException'), err
