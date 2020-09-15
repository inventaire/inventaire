const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const { baseBanTime, banTimeIncreaseFactor } = CONFIG.outgoingRequests

const timeoutData = {}

const throwIfTemporarilyBanned = host => {
  const hostTimeoutData = timeoutData[host]
  if (hostTimeoutData != null && Date.now() < hostTimeoutData.expire) {
    throw error_.new('temporary ban', 500, { host, timeoutData: hostTimeoutData })
  }
}

const resetBanData = host => delete timeoutData[host]

const declareTimeout = host => {
  let hostTimeoutData = timeoutData[host]

  if (hostTimeoutData) {
    // This host persists to timeout: renew and increase ban time
    hostTimeoutData.banTime *= banTimeIncreaseFactor
  } else {
    hostTimeoutData = timeoutData[host] = { banTime: baseBanTime }
  }

  hostTimeoutData.expire = Date.now() + hostTimeoutData.banTime
}

module.exports = { throwIfTemporarilyBanned, resetBanData, declareTimeout }
