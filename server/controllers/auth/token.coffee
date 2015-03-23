CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next) ->
  {token, email} = req.query
  unless token? then return error_.bundle res, 'no token provided', 400
  unless email? then return error_.bundle res, 'no email provided', 400

  user_.confirmEmailValidity(email, token)
  .then redirectValidEmail.bind(null, res, true)
  .catch redirectValidEmail.bind(null, res, false)


redirectValidEmail = (res, bool)->
  res.redirect "/?validEmail=#{bool}"
