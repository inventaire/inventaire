const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const db = __.require('level', 'get_sub_db')('timeouts', 'json')
const { baseBanTime, banTimeIncreaseFactor } = CONFIG.outgoingRequests
// Using port to keep instances data separated
// to avoid overriding data between instances
// TODO: share ban data among instances
const dbKey = CONFIG.port

let timeoutData = {}

db.get(dbKey)
.then(data => {
  timeoutData = data
  if (Object.keys(timeoutData).length > 0) _.success(timeoutData, 'timeouts data restored')
})
.catch(err => {
  if (err.name === 'NotFoundError') return _.warn('no timeouts data found')
  else _.error(err, 'timeouts init err')
})

const throwIfTemporarilyBanned = host => {
  const hostTimeoutData = timeoutData[host]
  if (hostTimeoutData != null && Date.now() < hostTimeoutData.expire) {
    throw error_.new(`temporary ban: ${host}`, 500, { host, timeoutData: hostTimeoutData })
  }
}

const resetBanData = host => {
  delete timeoutData[host]
  lazyBackup()
}

const declareTimeout = host => {
  let hostTimeoutData = timeoutData[host]

  if (hostTimeoutData) {
    // Prevent several simulateous requests to all multiply the ban time
    // while the service might actually only have been down for a short while
    if (Date.now() < hostTimeoutData.expire) return
    // This host persists to timeout: renew and increase ban time
    hostTimeoutData.banTime *= banTimeIncreaseFactor
  } else {
    hostTimeoutData = timeoutData[host] = { banTime: baseBanTime }
  }

  hostTimeoutData.expire = Date.now() + hostTimeoutData.banTime
  lazyBackup()
}

const backup = () => {
  db.put(dbKey, timeoutData)
  .then(() => _.success('timeouts data backup'))
  .catch(_.Error('timeouts data backup err'))
}

const lazyBackup = _.debounce(backup, 10 * 1000)

module.exports = { throwIfTemporarilyBanned, resetBanData, declareTimeout }
