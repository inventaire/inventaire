CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

helpers_ = require './helpers'
transporter_ = require './transporter'
email_ = require './email'


module.exports =
  friendAcceptedRequest: (userToNotify, newFriend)->
    helpers_.getUsersData(userToNotify, newFriend)
    .then email_.friendAcceptedRequest
    .then transporter_.sendMail
    .catch Err('friendAcceptedRequest', userToNotify, newFriend)

  friendshipRequest: (userToNotify, requestingUser)->
    helpers_.getUsersData(userToNotify, requestingUser)
    .then email_.friendshipRequest
    .then transporter_.sendMail
    .catch Err('friendshipRequest', userToNotify, requestingUser)

Err = (label, user1, user2)->
  _.Error("#{label} email fail for #{user1} / #{user2}")