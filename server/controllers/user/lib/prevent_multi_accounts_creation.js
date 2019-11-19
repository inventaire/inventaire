/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// preventing several accounts to be created at the same time
// given that the creation process is considerably slowed by bcrypt

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')

let lockedUsernames = []
const errMessage = 'an account is already in the process of being created with this username'

module.exports = username => {
  const recentUsernames = lockedUsernames.map(_.property('username'))
  if (recentUsernames.includes(username)) {
    throw error_.new(errMessage, 400, username, recentUsernames)
  } else {
    lock(username)
  }
}

const lock = username => {
  lockedUsernames.push({
    username,
    timestamp: Date.now()
  })
}

// Once a username is added to the list, it has 5 seconds to create the account
// (which should be at least twice more than what is needed)
// after what the lock is removed
const removeExpiredLocks = () => {
  lockedUsernames = lockedUsernames
    // Only keep accounts that started to be created less than 5 secondes ago
    .filter(data => !_.expired(data.timestamp, 5000))
}

setInterval(removeExpiredLocks, 10 * 1000)
