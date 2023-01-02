import { red, yellow, grey } from 'tiny-chalk'

const oneSecond = 1000
const oneMinute = 60 * oneSecond
const oneHour = 60 * oneMinute
const oneDay = 24 * oneHour

const msToHumanTime = ms => {
  const seconds = Math.trunc((ms / oneSecond) % 60)
  const minutes = Math.trunc((ms / oneMinute) % 60)
  const hours = Math.trunc((ms / oneHour) % 24)
  const days = Math.trunc(ms / oneDay)
  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

const coloredElapsedTime = startTime => {
  if (startTime == null) return ''
  const [ seconds, nanoseconds ] = process.hrtime(startTime)
  const elapsedMs = Math.round((seconds * 1000) + (nanoseconds / 1000000))
  if (elapsedMs > 10000) return red(`${elapsedMs}ms`)
  else if (elapsedMs > 1000) return yellow(`${elapsedMs}ms`)
  else return grey(`${elapsedMs}ms`)
}

export default {
  oneMinute,
  tenMinutes: 10 * oneMinute,
  fiveMinutes: 5 * oneMinute,
  oneHour,
  oneDay,
  oneWeek: 7 * oneDay,
  oneMonth: 30 * oneDay,
  oneYear: 365 * oneDay,

  expired: (timestamp, ttl) => (Date.now() - timestamp) > ttl,

  msToHumanTime,

  msToHumanAge: ms => msToHumanTime(Date.now() - ms),

  coloredElapsedTime,
}
