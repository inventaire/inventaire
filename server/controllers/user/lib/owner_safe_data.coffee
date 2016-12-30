__ = require('config').universalPath
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'

module.exports = (user)-> _.pick user, User.attributes.ownerSafe
