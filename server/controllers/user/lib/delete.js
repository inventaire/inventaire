const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const couch_ = __.require('lib', 'couch')
const User = __.require('models', 'user')

module.exports = (db, user_) => {
  const deleteUser = user => db.del(user._id, user._rev)

  const softDeleteById = userId => db.update(userId, User.softDelete)

  // only used by tests so far
  const deleteByUsername = username => {
    _.info(username, 'deleteUserbyUsername')
    return user_.byUsername(username)
    .then(couch_.firstDoc)
    .then(deleteUser)
    .catch(_.Error('deleteUserbyUsername err'))
  }

  return {
    softDeleteById,
    deleteByUsername
  }
}
