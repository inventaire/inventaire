import _ from '#builders/utils'
import { getUserByUsername } from '#controllers/user/lib/user'
import dbFactory from '#db/couchdb/base'
import { firstDoc } from '#lib/couch'
import User from '#models/user'

const db = dbFactory('users')

const deleteUser = user => db.del(user._id, user._rev)

export default {
  softDeleteById: userId => db.update(userId, User.softDelete),

  // Only used by tests so far
  deleteByUsername: username => {
    _.info(username, 'deleteUserbyUsername')
    return getUserByUsername(username)
    .then(firstDoc)
    .then(deleteUser)
    .catch(_.Error('deleteUserbyUsername err'))
  },
}
