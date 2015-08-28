CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

helpers_ = require './helpers'
transporter_ = require './transporter'
email_ = require './email'


module.exports =
  validationEmail: (userData, token)->
    email = email_.validationEmail(userData, token)
    transporter_.sendMail email
    .catch _.Error('validationEmail')

  resetPassword: (userData, token)->
    email = email_.resetPassword(userData, token)
    transporter_.sendMail email
    .catch _.Error('resetPassword')

  friendAcceptedRequest: (userToNotify, newFriend)->
    helpers_.getUsersData(userToNotify, newFriend)
    .then email_.friendAcceptedRequest
    .then transporter_.sendMail
    .catch helpers_.catchDisabledEmails
    .catch Err('friendAcceptedRequest', userToNotify, newFriend)

  friendshipRequest: (userToNotify, requestingUser)->
    helpers_.getUsersData(userToNotify, requestingUser)
    .then email_.friendshipRequest
    .then transporter_.sendMail
    .catch helpers_.catchDisabledEmails
    .catch Err('friendshipRequest', userToNotify, requestingUser)

  group: (action, groupId, actingUserId, userToNotifyId)->
    helpers_.getGroupAndUsersData groupId, actingUserId, userToNotifyId
    .then email_.group.bind(null, action)
    .then transporter_.sendMail
    .catch helpers_.catchDisabledEmails
    .catch Err("group #{action}", actingUserId, userToNotifyId)

  feedback: (subject, message, user, unknownUser)->
    email = email_.feedback(subject, message, user, unknownUser)
    transporter_.sendMail email
    .catch _.Error('feedback')

  emailInvitations: (user, emailAddresses, message)->
    emailFactory = email_.EmailInvitation user, message
    emailAddresses.forEach (emailAddress)->
      email = emailFactory emailAddress
      transporter_.sendMail email
      .catch _.Error('emailInvitations')


Err = (label, user1, user2)->
  _.Error("#{label} email fail for #{user1} / #{user2}")
