import { track } from 'lib/track'
import User from 'models/user'
import headers_ from 'lib/headers'
import createUser from 'controllers/user/lib/create'
import { Strategy as LocalStrategy } from 'passport-local'

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

export default new LocalStrategy(options, verify)
