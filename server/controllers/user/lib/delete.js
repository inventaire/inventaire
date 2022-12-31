import _ from 'builders/utils'
import couch_ from 'lib/couch'
import User from 'models/user'
import dbFactory from 'db/couchdb/base'
import user_ from './user'
const db = dbFactory('users')

const deleteUser = user => db.del(user._id, user._rev)

export default {
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
