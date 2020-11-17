const oneMinute = 60 * 1000
const oneHour = 60 * oneMinute
const oneDay = 24 * oneHour

module.exports = {
  oneMinute,
  tenMinutes: 10 * oneMinute,
  oneHour,
  oneDay,
  oneMonth: 30 * oneDay,
  oneYear: 365 * oneDay,

  expired: (timestamp, ttl) => (Date.now() - timestamp) > ttl,

  msToHumanTime: ms => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / oneMinute) % 60)
    const hours = Math.floor((ms / oneHour) % 24)
    const days = Math.floor(ms / oneDay)
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }
}
