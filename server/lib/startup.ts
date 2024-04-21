import { red } from 'tiny-chalk'
import { initEmailServices } from '#lib/emails/mailer'
import { log, logErrorsCount } from '#lib/utils/logs'
import config from '#server/config'

export function beforeStartup () {
  initUncaughtExceptionCatcher()

  logErrorsCount()
  log(`node: ${process.version}`)
  log(`pid: ${process.pid}`)
  log(`env: ${config.env}`)
  log(`local origin: ${config.getLocalOrigin()}`)
  log(`public origin: ${config.getPublicOrigin()}`)
}

function initUncaughtExceptionCatcher () {
  process.on('uncaughtException', err => {
    console.error(red('uncaughtException'), err)
  })
}

export function afterStartup () {
  initEmailServices()
}
