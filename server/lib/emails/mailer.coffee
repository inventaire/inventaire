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
    .catch (err)->
      _.error err, "friendAcceptedRequest email
        fail for #{userToNotify} / #{newFriend}"


module.exports = ->
  Radio.on 'notify:friend:request:accepted', mailer.friendAcceptedRequest
