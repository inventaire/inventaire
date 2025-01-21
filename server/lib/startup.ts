import { red } from 'tiny-chalk'
import { initEmailServices } from '#lib/emails/mailer'
import { log, logErrorsCount } from '#lib/utils/logs'
import config, { getLocalOrigin, publicOrigin } from '#server/config'

export function beforeStartup () {
  initUncaughtExceptionCatcher()

  logErrorsCount()
  log(`node: ${process.version}`)
  log(`pid: ${process.pid}`)
  log(`NODE_ENV=${process.env.NODE_ENV || '<none>'} NODE_APP_INSTANCE=${process.env.NODE_APP_INSTANCE || '<none>'}`)
  log(`env: ${config.env}`)
  log(`local origin: ${getLocalOrigin()}`)
  log(`public origin: ${publicOrigin}`)
}

function initUncaughtExceptionCatcher () {
  process.on('uncaughtException', err => {
    console.error(red('uncaughtException'), err)
  })
}

export function afterStartup () {
  initEmailServices()
}
