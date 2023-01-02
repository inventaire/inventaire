import passport from 'passport'
import _ from '#builders/utils'
import { getUserById } from '#controllers/user/lib/user'
import { error_ } from '#lib/error/error'
import basicStrategy from '#lib/passport/basic_strategy'
import localLoginStrategy from '#lib/passport/local_login_strategy'
import localSignupStrategy from '#lib/passport/local_signup_strategy'
import tokenStrategy from '#lib/passport/token_strategy'
import { assert_ } from '#lib/utils/assert_types'

passport.serializeUser((user, done) => {
  assert_.object(user)
  assert_.function(done)
  const { _id: id } = user
  _.success(id, 'serializeUser')
  done(null, id)
})

passport.deserializeUser((id, done) => {
  assert_.string(id)
  assert_.function(done)
  return getUserById(id)
  .then(user => done(null, user))
  .catch(err => {
    if (err.statusCode === 404) {
      err = error_.new("Couldn't deserialize cookies: user not found", 400, id)
      err.name = 'SessionError'
    }
    _.error(err, 'deserializeUser err')
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
