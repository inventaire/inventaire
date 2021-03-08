const CONFIG = require('config')
const __ = CONFIG.universalPath
const { track } = require('lib/track')
const User = require('models/user')
const headers_ = require('lib/headers')
const createUser = require('controllers/user/lib/create')

const { Strategy: LocalStrategy } = require('passport-local')

const options = { passReqToCallback: true }

const verify = (req, username, password, done) => {
  const { email } = req.body
  const language = findLanguage(req)
  return createUser(username, email, 'local', language, password)
  .then(user => {
    if (user) {
      done(null, user)
      req.user = user
      track(req, [ 'auth', 'signup', 'local' ])
    } else {
      // case when user_.byId fails, rather unprobable
      done(new Error("couldn't get user"))
    }
  })
  .catch(done)
}

const findLanguage = req => {
  const lang = headers_.getLang(req.headers)
  if (User.validations.language(lang)) return lang
}

module.exports = new LocalStrategy(options, verify)
