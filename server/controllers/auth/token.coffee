CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'


module.exports = (req, res, next) ->
  {token} = req.query
  user_.confirmEmailValidity(token)
  .then redirectValidEmail.bind(null, res, true)
  .catch catchInvalidToken.bind(null, req, res)


redirectValidEmail = (res, bool)->
  res.redirect "/?validEmail=#{bool}"

catchInvalidToken = (req, res, err)->
  unless err.type is 'invalid_token'
    return _.errorHandler res, err

  warnInvalidToken req
  redirectValidEmail res, false

warnInvalidToken = (req)->
  _.warn 'invalid_token',
    token: req.token
    user: req.user
