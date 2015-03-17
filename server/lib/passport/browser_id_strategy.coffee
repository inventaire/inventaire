CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'

BrowserIdStrategy = require('passport-browserid').Strategy

options =
  audience: CONFIG.fullPublicHost()
  passReqToCallback: true

verify = (req, email, done)->
  {username} = req.body
  _.log [email, username], 'browserid verify params'
  user_.byEmail(email)
  .then (users)-> users?[0]
  .then (user)->
    if user?
      done(null, user)
    else if username? and User.validUsername(username)
      # this is browserid way to signup
      user_.create(username, email, 'browserid')
      .then (user)-> done(null, user)
    else
      _.error user, "user not found for #{email}"
      done(null, false)
  .catch (err)->
    _.error err, 'browserid verify err'
    done(err)


module.exports = new BrowserIdStrategy options, verify
