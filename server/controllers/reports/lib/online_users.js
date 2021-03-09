const _ = require('builders/utils')
const crypto_ = require('lib/crypto')

module.exports = data => {
  const fingerPrint = getFingerPrint(data)
  // If we have a user id, the user is logged in
  if (data.userId) onlineUsers[fingerPrint] = 1
  else onlineUsers[fingerPrint] = 0
}

let onlineUsers = {}
let last

const updateOnlineUsers = () => {
  const length = _.objLength(onlineUsers)
  const loggedUsers = _.sumValues(onlineUsers)
  const report = `logged in ${loggedUsers} / total ${length}`

  // Only log the amount of users online when there is a change
  if (report !== last) { _.info(report) }
  last = report
  onlineUsers = {}
}

const getFingerPrint = (...args) => {
  const str = JSON.stringify(args)
  return crypto_.md5(str)
}

setInterval(updateOnlineUsers, 30 * 1000)
