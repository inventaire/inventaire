import { md5 } from '#lib/crypto'
import { objLength, sumValues } from '#lib/utils/base'
import { info } from '#lib/utils/logs'

export default data => {
  const fingerPrint = getFingerPrint(data)
  // If we have a user id, the user is logged in
  if (data.userId) onlineUsers[fingerPrint] = 1
  else onlineUsers[fingerPrint] = 0
}

let onlineUsers = {}
let last

function updateOnlineUsers () {
  const length = objLength(onlineUsers)
  const loggedUsers = sumValues(onlineUsers)
  const report = `logged in ${loggedUsers} / total ${length}`

  // Only log the amount of users online when there is a change
  if (report !== last) { info(report) }
  last = report
  onlineUsers = {}
}

function getFingerPrint (...args) {
  const str = JSON.stringify(args)
  return md5(str)
}

setInterval(updateOnlineUsers, 30 * 1000)
