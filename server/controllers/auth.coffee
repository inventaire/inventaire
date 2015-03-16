CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
promises_ = __.require 'lib', 'promises'
passport_ = __.require 'lib', 'passport/passport'

module.exports.checkUsername = (req, res, next) ->
  reqUsername = req.body.username
  _.success reqUsername, 'checkUsername reqUsername'
  if User.validUsername reqUsername
    _.success reqUsername, 'validUsername'
    user_.nameIsAvailable reqUsername
    .then ()->
      res.json {username: reqUsername, status: 'available'}
    .catch (err)->
      obj =
        username: reqUsername
        status: 'not available'
        status_verbose: "this username isn't available"
        err: err
      res.status(400).json obj
    .done()
  else
    _.error reqUsername, 'nameIsntValid'
    obj =
      username: reqUsername
      status: 'invalid'
      status_verbose: 'invalid username'
    res.status(400).json obj

module.exports.signup = (req, res, next)->
  # _.log arguments, 'signup arguments'
  _.log req.body, 'req.body'
  {strategy} = req.body
  switch strategy
    when 'local' then passport_.authenticate.localSignup(req, res, next)
    else _.errorHandler(res, "unknown signup strategy: #{strategy}", 400)

module.exports.login = (req, res, next)->
  {strategy} = req.body
  switch strategy
    when 'local' then passport_.authenticate.localLogin(req, res, next)
    when 'browserid' then passport_.authenticate.browserid(req, res, next)
    else _.errorHandler(res, "unknown login strategy: #{strategy}", 400)

module.exports.logout = (req, res, next) ->
  res.clearCookie 'loggedIn'
  req.logout()
  res.redirect "/"
