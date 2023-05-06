import CONFIG from 'config'
import _ from '#builders/utils'
import dbFactory from '#db/level/get_sub_db'
import { error_ } from '#lib/error/error'
import { serverMode } from '#lib/server_mode'
import { warn, success, logError, LogError } from '#lib/utils/logs'

const db = dbFactory('hosts-bans', 'json')
const { baseBanTime, banTimeIncreaseFactor } = CONFIG.outgoingRequests
// Using port to keep instances data separated
// to avoid overriding data between instances
// TODO: share ban data among instances
const dbKey = CONFIG.port

const banData = {}

const restoreBanData = () => {
  db.get(dbKey)
  .then(restoreNonExpiredBans)
  .catch(err => {
    if (err.name === 'NotFoundError') return warn('no hosts bans data found')
    else logError(err, 'hosts bans init err')
  })
}

const restoreNonExpiredBans = data => {
  const now = Date.now()
  Object.keys(data).forEach(host => {
    const hostData = data[host]
    if (hostData.expire > now) banData[host] = data[host]
  })
  if (Object.keys(banData).length > 0) success(banData, 'hosts bans data restored')
}

export const assertHostIsNotTemporarilyBanned = host => {
  const hostBanData = banData[host]
  if (hostBanData != null && Date.now() < hostBanData.expire) {
    throw error_.new(`temporary ban: ${host}`, 500, { host, hostBanData })
  }
}

export const resetBanData = host => {
  delete banData[host]
  lazyBackup()
}

export const declareHostError = host => {
  // Never ban local services
  if (host.startsWith('localhost')) return

  let hostBanData = banData[host]

  if (hostBanData) {
    // Prevent several simulateous requests to all multiply the ban time
    // while the service might actually only have been down for a short while
    if (Date.now() < hostBanData.expire) return
    // This host persists to timeout: renew and increase ban time
    hostBanData.banTime *= banTimeIncreaseFactor
  } else {
    hostBanData = banData[host] = { banTime: baseBanTime }
  }

  hostBanData.expire = Date.now() + hostBanData.banTime
  lazyBackup()
}

const backup = () => {
  db.put(dbKey, banData)
  // .then(() => success('hosts bans data backup'))
  .catch(LogError('hosts bans data backup err'))
}

const lazyBackup = serverMode ? _.debounce(backup, 60 * 1000) : _.noop

if (serverMode) restoreBanData()
