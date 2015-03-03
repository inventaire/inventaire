CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

host = CONFIG.fullPublicHost()

base =
  from: 'hello@inventaire.io'

module.exports =
  friendAcceptedRequest: (options)->
    [user1, user2] = validateOptions options

    return _.extend {}, base,
      to: user1.email
      subject: "#{user2.username} accepted your request!"
      template: 'friend_accepted_request'
      context:
        friend: user2
        host: host

  friendshipRequest: (options)->
    [user1, user2] = validateOptions options

    return _.extend {}, base,
      to: user1.email
      subject: "#{user2.username} invites you to connect your inventories!"
      template: 'friendship_request'
      context:
        otherUser: user2
        host: host

validateOptions = (options)->
  {user1, user2} = options
  _.types [user1, user2], ['object', 'object']
  unless user1.email? then throw new Error "missing user1 email"
  unless user2.username? then throw new Error "missing user2 username"
  return [user1, user2]