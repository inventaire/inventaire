CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next) ->
  {token} = req.query
  user_.confirmEmailValidity(token)
  .then redirectValidEmail.bind(null, res, true)
  .catch error_.Handler(res)


redirectValidEmail = (res, bool)->
  res.redirect "/?validEmail=#{bool}"
