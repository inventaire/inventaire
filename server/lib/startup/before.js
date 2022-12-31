import CONFIG from 'config'
import _ from 'builders/utils'

// Needs to be run before the first promise is fired
// so that the configuration applies to all

import { red } from 'chalk'

import { logErrorsCount } from 'lib/utils/logs'

export default () => {
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
