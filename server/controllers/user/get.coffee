__ = require('config').universalPath
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'

module.exports = (req, res) ->
  userData = securedData req.user
  res.json userData

securedData = (user)-> _.pick user, User.attributes.ownerSafe
