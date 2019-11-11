// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const couch_ = __.require('lib', 'couch')
const User = __.require('models', 'user')

module.exports = function(db, user_){

  let API
  const deleteUser = user => db.del(user._id, user._rev)

  const softDeleteById = userId => db.update(userId, User.softDelete)

  // only used by tests so far
  const deleteByUsername = function(username){
    _.info(username, 'deleteUserbyUsername')
    return user_.byUsername(username)
    .then(couch_.firstDoc)
    .then(deleteUser)
    .catch(_.Error('deleteUserbyUsername err'))
  }

  return API = {
    softDeleteById,
    deleteByUsername
  }
}
