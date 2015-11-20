# preventing several accounts to be created at the same time
# given that the creation process is considerably slowed by bcrypt

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

lockedUsernames = []
errMessage = 'an account is already in the process of being created with this username'

module.exports = (username)->
  recentUsernames = lockedUsernames.map _.property('username')
  if username in recentUsernames
    throw error_.new errMessage, 400, username, recentUsernames
  else
    lock username


lock = (username)->
  lockedUsernames.push
    username: username
    timestamp: _.now()

# once a username is added to the list, it has 5 seconds to create the account
# (which should be at least twice more than what is needed)
# after what the lock is removed
removeExpiredLocks = ->
  lockedUsernames = lockedUsernames.filter (data)->
    # only keep accounts that start to be created less than 5 secondes ago
    not _.expired data.timestamp, 5000


setInterval removeExpiredLocks, 10*1000
