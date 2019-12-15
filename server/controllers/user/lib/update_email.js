const CONFIG = require('config')
const __ = CONFIG.universalPath
const db = __.require('couch', 'base')('users')
const User = __.require('models', 'user')
const token_ = require('./token')

module.exports = (user, email) => {
  user = User.updateEmail(user, email)
  return db.put(user)
  // sendValidationEmail doesn't need to access the last _rev
  // so it's ok to pass the user as it was before the database was updated
  .then(() => token_.sendValidationEmail(user))
}
