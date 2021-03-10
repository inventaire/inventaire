const _ = require('builders/utils')
const couch_ = require('lib/couch')
const User = require('models/user')
const db = require('db/couchdb/base')('users')
const user_ = require('./user')

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
