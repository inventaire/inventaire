import CONFIG from 'config'
import { Strategy as LocalStrategy } from 'passport-local'
import { openPasswordUpdateWindow } from '#controllers/user/lib/token'
import { findUserByEmail } from '#controllers/user/lib/user'
import { verifyPassword } from '#lib/crypto'
import { newError } from '#lib/error/error'
import { logError, Log } from '#lib/utils/logs'
import loginAttempts from './login_attempts.js'

const { tokenDaysToLive } = CONFIG

// Reusing LocalStrategy but substituing username/password by email/token
const options = {
  usernameField: 'email',
  passwordField: 'token',
  passReqToCallback: true,
}

const verify = (req, email, token, done) => {
  if (loginAttempts.tooMany(email)) {
    done(null, false, { message: 'too_many_attempts' })
  }

  return findUserByEmail(email)
  .catch(invalidEmailOrToken.bind(null, done, email, 'findOneByEmail'))
  .then(returnIfValid.bind(null, done, token, email))
  .catch(finalError.bind(null, done))
}

const returnIfValid = (done, token, email, user) => {
  // Need to check user existance to avoid
  // to call invalidEmailOrToken a second time
  // in case findOneByemail returned an error
  if (!user) return

  return verifyToken(user, token)
  .then(valid => {
    if (valid) {
      return openPasswordUpdateWindow(user)
      .then(Log('clearToken res'))
      .then(() => done(null, user))
    } else {
      return invalidEmailOrToken(done, email, 'validity test')
    }
  })
  .catch(invalidEmailOrToken.bind(null, done, email, 'verifyToken'))
}

const invalidEmailOrToken = (done, email, label, err) => {
  loginAttempts.recordFail(email, label)
  done(null, false, { message: 'invalid_username_or_token' })
}

const verifyToken = async (user, token) => {
  if (user.token == null) throw newError('no token found', 401)
  return verifyPassword(user.token, token, tokenDaysToLive)
}

const finalError = (done, err) => {
  logError(err, 'TokenStrategy verify err')
  done(err)
}

export default new LocalStrategy(options, verify)
