// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
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

const { Strategy: LocalStrategy } = require('passport-local')

const options =
  { passReqToCallback: true }

const verify = (req, username, password, done) => {
  const { email } = req.body
  const language = user_.findLanguage(req)
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

module.exports = new LocalStrategy(options, verify)
