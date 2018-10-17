{ red } = require 'chalk'

module.exports = ->
  initUncaughtExceptionCatcher()

initUncaughtExceptionCatcher = ->
  process.on 'uncaughtException', (err)-> console.error red('uncaughtException'), err
