CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
User = __.require 'models', 'user'

module.exports = (db, user_)->

  deleteUser = (user)->
    db.del user._id, user._rev

  softDeleteById = (userId)->
    db.update userId, User.softDelete

  # only used by tests so far
  deleteByUsername = (username)->
    _.info username, 'deleteUserbyUsername'
    user_.byUsername username
    .then couch_.firstDoc
    .then deleteUser
    .catch _.Error('deleteUserbyUsername err')

  return API =
    softDeleteById: softDeleteById
    deleteByUsername: deleteByUsername
