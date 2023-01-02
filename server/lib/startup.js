import CONFIG from 'config'
import { red } from 'tiny-chalk'
import _ from '#builders/utils'
import { initEmailServices } from '#lib/emails/mailer'
import { logErrorsCount } from '#lib/utils/logs'

export function beforeStartup () {
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

export function afterStartup () {
  initEmailServices()
}
