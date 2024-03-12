import { Strategy as LocalStrategy } from 'passport-local'
import { openPasswordUpdateWindow } from '#controllers/user/lib/token'
import { findUserByEmail } from '#controllers/user/lib/user'
import { verifyPassword } from '#lib/crypto'
import { newError } from '#lib/error/error'
import { logError } from '#lib/utils/logs'
import CONFIG from '#server/config'
import type { Req } from '#types/server'
import type { Email, User } from '#types/user'
import loginAttempts from './login_attempts.js'

const { tokenDaysToLive } = CONFIG

// Reusing LocalStrategy but substituing username/password by email/token
const options = {
  usernameField: 'email',
  passwordField: 'token',
  passReqToCallback: true,
}

function verify (req: Req, email: Email, token: string, done) {
  if (loginAttempts.tooMany(email)) {
    done(null, false, { message: 'too_many_attempts' })
  }

  return findUserByEmail(email)
  .catch(invalidEmailOrToken.bind(null, done, email))
  .then(returnIfValid.bind(null, done, token, email))
  .catch(finalError.bind(null, done))
}

async function returnIfValid (done, token: string, email: Email, user?: User) {
  // Need to check user existance to avoid
  // to call invalidEmailOrToken a second time
  // in case findOneByemail returned an error
  if (!user) return

  try {
    const valid = await verifyToken(user, token)
    if (valid) {
      await openPasswordUpdateWindow(user)
      done(null, user)
    } else {
      invalidEmailOrToken(done, email)
    }
  } catch (err) {
    invalidEmailOrToken(done, email, err)
  }
}

function invalidEmailOrToken (done, email, err?: Error) {
  logError(err, 'invalid email or token')
  loginAttempts.recordFail(email)
  done(null, false, { message: 'invalid_username_or_token' })
}

async function verifyToken (user, token) {
  if (user.token == null) throw newError('no token found', 401)
  return verifyPassword(user.token, token, tokenDaysToLive)
}

function finalError (done, err) {
  logError(err, 'TokenStrategy verify err')
  done(err)
}

export default new LocalStrategy(options, verify)
