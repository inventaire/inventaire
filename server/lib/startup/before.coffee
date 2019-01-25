CONFIG = require 'config'
__ = CONFIG.universalPath
# Needs to be run before the first promise is fired
# so that the configuration applies to all
{ Promise } = __.require 'lib', 'promises'

{ red } = require 'chalk'

module.exports = ->
  initUncaughtExceptionCatcher()

initUncaughtExceptionCatcher = ->
  process.on 'uncaughtException', (err)-> console.error red('uncaughtException'), err
