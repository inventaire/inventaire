CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
pw_ = __.require('lib', 'crypto').passwords
loginAttempts = require './login_attempts'

LocalStrategy = require('passport-local').Strategy

options =
  passReqToCallback: true

verify = (req, username, password, done)->
  { email } = req.body
  language = user_.findLanguage(req)
  user_.create(username, email, 'local', language, password)
  .then (user)->
    if user? then done null, user
    else
      # case when user_.byId fails, rather unprobable
      done new Error "couldn't get user"

  # the error will be logged by the final error_.handler
  .catch done

module.exports = new LocalStrategy options, verify