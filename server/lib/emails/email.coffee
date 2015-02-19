CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

base =
  from: 'hello@inventaire.io'

module.exports =
  friendAcceptedRequest: (options)->
    {user, friend} = options

    _.types [user, friend], ['object', 'object']
    unless user.email? then throw new Error "missing user email"
    unless friend.username? then throw new Error "missing friend username"

    return _.extend {}, base,
      to: user.email
      subject: "#{friend.username} accepted your request!"
      template: 'friend_accepted_request'
      context:
        friend: friend
        host: CONFIG.fullPublicHost()
