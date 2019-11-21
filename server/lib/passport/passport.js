const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')

const passport = require('passport')

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

module.exports = {
  passport,
  authenticate: {
    localLogin: passport.authenticate('local-login'),
    localSignup: passport.authenticate('local-signup'),
    resetPassword: passport.authenticate('token',
      { failureRedirect: '/login/forgot-password?resetPasswordFail=true' }),
    basic: passport.authenticate('basic', { session: false })
  }
}
