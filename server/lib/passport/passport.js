import passport from 'passport'
import _ from '#builders/utils'
import user_ from '#controllers/user/lib/user'
import error_ from '#lib/error/error'
import assert_ from '#lib/utils/assert_types'

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
  return user_.byId(id)
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

passport.use('local-login', require('./local_login_strategy'))
passport.use('local-signup', require('./local_signup_strategy'))
passport.use('token', require('./token_strategy'))
passport.use('basic', require('./basic_strategy'))

export default {
  passport,
  authenticate: {
    localLogin: passport.authenticate('local-login'),
    localSignup: passport.authenticate('local-signup'),
    resetPassword: passport.authenticate('token', {
      failureRedirect: '/login/forgot-password?resetPasswordFail=true'
    }),
    basic: passport.authenticate('basic', { session: false })
  }
}
