import passport from 'passport'
import { getUserById } from '#controllers/user/lib/user'
import { newError } from '#lib/error/error'
import basicStrategy from '#lib/passport/basic_strategy'
import localLoginStrategy from '#lib/passport/local_login_strategy'
import localSignupStrategy from '#lib/passport/local_signup_strategy'
import tokenStrategy from '#lib/passport/token_strategy'
import { assertObject, assertFunction, assertString } from '#lib/utils/assert_types'
import { success, logError } from '#lib/utils/logs'

passport.serializeUser((user, done) => {
  assertObject(user)
  assertFunction(done)
  const { _id: id } = user
  success(id, 'serializeUser')
  done(null, id)
})

passport.deserializeUser((id, done) => {
  assertString(id)
  assertFunction(done)
  return getUserById(id)
  .then(user => done(null, user))
  .catch(err => {
    if (err.statusCode === 404) {
      err = newError("Couldn't deserialize cookies: user not found", 400, id)
      err.name = 'SessionError'
    }
    logError(err, 'deserializeUser err')
    done(err)
  })
})

passport.use('local-login', localLoginStrategy)
passport.use('local-signup', localSignupStrategy)
passport.use('token', tokenStrategy)
passport.use('basic', basicStrategy)

export default {
  passport,
  authenticate: {
    localLogin: passport.authenticate('local-login'),
    localSignup: passport.authenticate('local-signup'),
    resetPassword: passport.authenticate('token', {
      failureRedirect: '/login/forgot-password?resetPasswordFail=true',
    }),
    basic: passport.authenticate('basic', { session: false }),
  },
}
