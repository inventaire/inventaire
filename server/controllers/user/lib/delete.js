const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const couch_ = __.require('lib', 'couch')
const User = __.require('models', 'user')
const db = __.require('couch', 'base')('users')

// Working around circular dependencies
let user_
const lateRequire = () => { user_ = require('./user') }
setTimeout(lateRequire, 0)

const deleteUser = user => db.del(user._id, user._rev)

module.exports = {
  softDeleteById: userId => db.update(userId, User.softDelete),

  // Only used by tests so far
  deleteByUsername: username => {
    _.info(username, 'deleteUserbyUsername')
    return user_.byUsername(username)
    .then(couch_.firstDoc)
    .then(deleteUser)
    .catch(_.Error('deleteUserbyUsername err'))
  }
}
