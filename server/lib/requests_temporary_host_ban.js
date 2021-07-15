const CONFIG = require('config')
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const db = require('db/level/get_sub_db')('hosts-bans', 'json')
const { serverMode } = CONFIG
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
    if (err.name === 'NotFoundError') return _.warn('no hosts bans data found')
    else _.error(err, 'hosts bans init err')
  })
}

const restoreNonExpiredBans = data => {
  const now = Date.now()
  Object.keys(data).forEach(host => {
    const hostData = data[host]
    if (hostData.expire > now) banData[host] = data[host]
  })
  if (Object.keys(banData).length > 0) _.success(banData, 'hosts bans data restored')
}

const throwIfTemporarilyBanned = host => {
  const hostBanData = banData[host]
  if (hostBanData != null && Date.now() < hostBanData.expire) {
    throw error_.new(`temporary ban: ${host}`, 500, { host, hostBanData })
  }
}

const resetBanData = host => {
  delete banData[host]
  lazyBackup()
}

const declareHostError = host => {
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
  .then(() => _.success('hosts bans data backup'))
  .catch(_.Error('hosts bans data backup err'))
}

const lazyBackup = serverMode ? _.debounce(backup, 10 * 1000) : _.noop

if (serverMode) restoreBanData()

module.exports = { throwIfTemporarilyBanned, resetBanData, declareHostError }
