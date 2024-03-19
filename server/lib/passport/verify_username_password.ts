import { findUserByUsernameOrEmail } from '#controllers/user/lib/user'
import { verifyPassword } from '#lib/crypto'
import { logError } from '#lib/utils/logs'
import loginAttempts from './login_attempts.js'

export default (username: string, password: string, done) => {
  if (loginAttempts.tooMany(username)) {
    done(null, false, { message: 'too_many_attempts' })
  }

  // addressing the case an email is provided instead of a username
  return findUserByUsernameOrEmail(username)
  .catch(invalidUsernameOrPassword.bind(null, done, username))
  .then(returnIfValid.bind(null, done, password, username))
  .catch(finalError.bind(null, done))
}

function returnIfValid (done, password, username, user) {
  // need to check user existance to avoid
  // to call invalidUsernameOrPassword a second time
  // in case findOneByUsername returned an error
  if (!user) return

  return verifyPassword(user.password, password)
  .then(valid => {
    if (valid) done(null, user)
    else return invalidUsernameOrPassword(done, username)
  })
  .catch(invalidUsernameOrPassword.bind(null, done, username))
}

function invalidUsernameOrPassword (done, username) {
  loginAttempts.recordFail(username)
  done(null, false, { message: 'invalid_username_or_password' })
}

function finalError (done, err) {
  logError(err, 'username/password verify err')
  done(err)
}
