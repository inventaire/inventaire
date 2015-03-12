CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user'
promises_ = __.require 'lib', 'promises'

passport = require 'passport'

passport.serializeUser (user, done) ->
  _.types [user, done], ['object', 'function']
  _.success id = user._id, 'user id'
  done null, id

passport.deserializeUser (id, done) ->
  _.types [id, done], ['string', 'function']
  user_.byId(id)
  .then (user)->
    done(null, user)
  .catch (err)->
    _.error err, 'err'
    done(err)

passport.use 'browserid', require('./browser_id_strategy')

options =
  afterComplete: (req, res)->
    res.cookie 'loggedin', true
    res.send 'ok'

module.exports =
  passport: passport
  authenticate:
    browserid: passport.authenticate 'browserid', options
