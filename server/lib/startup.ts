import { red } from 'tiny-chalk'
import { initEmailServices } from '#lib/emails/mailer'
import { log, logErrorsCount } from '#lib/utils/logs'
import CONFIG from '#server/config'

export function beforeStartup () {
  initUncaughtExceptionCatcher()

  logErrorsCount()
  log(`pid: ${process.pid}`)
  log(`env: ${CONFIG.env}`)
  log(`local origin: ${CONFIG.getLocalOrigin()}`)
  log(`public origin: ${CONFIG.getPublicOrigin()}`)
}

const initUncaughtExceptionCatcher = () => {
  process.on('uncaughtException', err => {
    console.error(red('uncaughtException'), err)
  })
}

export function afterStartup () {
  initEmailServices()
}
