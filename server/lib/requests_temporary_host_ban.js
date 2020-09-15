const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const { baseBanTime, banTimeIncreaseFactor } = CONFIG.outgoingRequests

const timeoutData = {}

const checkHostBan = host => {
  const hostTimeoutData = timeoutData[host]
  if (hostTimeoutData != null) {
    if (Date.now() < hostTimeoutData.expire) {
      throw error_.new('temporary ban', 500, { host, timeoutData: hostTimeoutData })
    }
  }
}

const declareTimeout = (host, err) => {
  if (err.type !== 'request-timeout') return

  let hostTimeoutData = timeoutData[host]

  if (hostTimeoutData) {
    // This host persists to timeout: renew and increase ban time
    hostTimeoutData.banTime *= banTimeIncreaseFactor
  } else {
    hostTimeoutData = timeoutData[host] = { banTime: baseBanTime }
  }

  hostTimeoutData.expire = Date.now() + hostTimeoutData.banTime
}

module.exports = { checkHostBan, declareTimeout }
