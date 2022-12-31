import dbFactory from 'db/couchdb/base'
import User from 'models/user'
import token_ from './token'
const db = dbFactory('users')

export default (user, email) => {
  user = User.updateEmail(user, email)
  return db.put(user)
  // sendValidationEmail doesn't need to access the last _rev
  // so it's ok to pass the user as it was before the database was updated
  .then(() => token_.sendValidationEmail(user))
}
