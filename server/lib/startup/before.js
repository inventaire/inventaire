const CONFIG = require('config')
const _ = require('builders/utils')
// Needs to be run before the first promise is fired
// so that the configuration applies to all

const { red } = require('chalk')
const { logErrorsCount } = require('lib/utils/logs')

module.exports = () => {
  initUncaughtExceptionCatcher()

  logErrorsCount()
  _.log(`pid: ${process.pid}`)
  _.log(`env: ${CONFIG.env}`)
  _.log(`local origin: ${CONFIG.getLocalOrigin()}`)
  _.log(`public origin: ${CONFIG.getPublicOrigin()}`)
}

const initUncaughtExceptionCatcher = () => {
  process.on('uncaughtException', err => {
    console.error(red('uncaughtException'), err)
  })
}
