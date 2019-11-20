
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const user_ = __.require('controllers', 'user/lib/user')
const { track } = __.require('lib', 'track')
const User = __.require('models', 'user')
const headers_ = __.require('lib', 'headers')

const { Strategy: LocalStrategy } = require('passport-local')

const options = { passReqToCallback: true }

const verify = (req, username, password, done) => {
  const { email } = req.body
  const language = findLanguage(req)
  return user_.create(username, email, 'local', language, password)
  .then(user => {
    if (user != null) {
      done(null, user)
      req.user = user
      return track(req, [ 'auth', 'signup', 'local' ])
    } else {
      // case when user_.byId fails, rather unprobable
      return done(new Error("couldn't get user"))
    }
  })
  .catch(done)
}

const findLanguage = req => {
  const lang = headers_.getLang(req.headers)
  if (User.validations.language(lang)) return lang
}

module.exports = new LocalStrategy(options, verify)
