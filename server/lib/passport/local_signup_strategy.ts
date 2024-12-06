import { Strategy as LocalStrategy } from 'passport-local'
import createUser from '#controllers/user/lib/create'
import { getLangFromHeaders } from '#lib/headers'
import { track } from '#lib/track'
import userValidations from '#models/validations/user'
import type { Req } from '#types/server'
import type { Username } from '#types/user'

const options = { passReqToCallback: true }

function verify (req: Req, username: Username, password: string, done) {
  const { email } = req.body
  const language = findLanguage(req)
  return createUser(username, email, language, password)
  .then(user => {
    if (user) {
      done(null, user)
      // @ts-expect-error
      req.user = user
      track(req, [ 'auth', 'signup' ])
    } else {
      // case when getUserById fails, rather unprobable
      done(new Error("couldn't get user"))
    }
  })
  .catch(done)
}

function findLanguage (req) {
  const lang = getLangFromHeaders(req.headers)
  if (userValidations.language(lang)) return lang
}

export default new LocalStrategy(options, verify)
