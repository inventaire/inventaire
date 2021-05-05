// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

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

module.exports = {
  oneMinute,
  tenMinutes: 10 * oneMinute,
  oneHour,
  oneDay,
  oneMonth: 30 * oneDay,
  oneYear: 365 * oneDay,

  expired: (timestamp, ttl) => (Date.now() - timestamp) > ttl,

  msToHumanTime,

  msToHumanAge: ms => msToHumanTime(Date.now() - ms)
}
