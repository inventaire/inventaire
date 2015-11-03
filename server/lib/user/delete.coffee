# only used by tests so far

CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports = (db, user_)->

  deleteUser = (user)-> db.del user._id, user._rev

  return deleteByUsername = (username)->
    _.info username, 'deleteUserbyUsername'
    user_.byUsername username
    .then (docs)-> docs[0]
    .then deleteUser
    .catch _.Error('deleteUserbyUsername err')
