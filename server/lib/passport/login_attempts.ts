import { oneMinute } from '#lib/time'

const attemptsLimit = 10
const periodMinutes = 5

let fails = {}
function flushFails () { fails = {} }

setInterval(flushFails, periodMinutes * oneMinute)

export default {
  _fails: () => fails,
  _flushFails: flushFails,
  recordFail: username => {
    if (!fails[username]) fails[username] = 0
    return ++fails[username]
  },

  tooMany: username => {
    const userFails = fails[username]
    return userFails != null && userFails >= attemptsLimit
  },
}
