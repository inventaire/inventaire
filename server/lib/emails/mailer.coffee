CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'

helpers_ = __.require 'lib', 'emails/helpers'
transporter_ = __.require 'lib', 'emails/transporter'
email_ = __.require 'lib', 'emails/email'


mailer =
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

module.exports = ->
  Radio.on 'notify:friend:request:accepted', mailer.friendAcceptedRequest
  Radio.on 'notify:friendship:request', mailer.friendshipRequest
