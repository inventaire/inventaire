CONFIG = require 'config'
__ = CONFIG.universalPath
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
    helpers_.getUsersByIds(userToNotify, newFriend)
    .then email_.friendAcceptedRequest
    .then transporter_.sendMail
    .catch helpers_.catchDisabledEmails
    .catch Err('friendAcceptedRequest', userToNotify, newFriend)

  friendshipRequest: (userToNotify, requestingUser)->
    helpers_.getUsersByIds(userToNotify, requestingUser)
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

  friendInvitations: (user, emailAddresses, message)->
    emailFactory = email_.FriendInvitation user, message
    sendSequentially emailAddresses, emailFactory, 'friendInvitations'

  groupInvitations: (user, group, emailAddresses, message)->
    emailFactory = email_.GroupInvitation user, group, message
    sendSequentially emailAddresses, emailFactory, 'groupInvitations'

sendSequentially = (emailAddresses, emailFactory, label)->
  # Do not mutate the original object
  addresses = _.clone emailAddresses
  sendNext = ->
    nextAddress = addresses.pop()
    unless nextAddress then return

    _.info nextAddress, "#{label}: next. Remaining: #{addresses.length}"

    email = emailFactory nextAddress
    transporter_.sendMail email
    .catch _.Error("#{label} (address: #{nextAddress} err)")
    # Wait to lower risk to trigger any API quota issue from the email service
    .delay 500
    # In any case, send the next
    .then sendNext

  return sendNext()

Err = (label, user1, user2)->
  _.Error("#{label} email fail for #{user1} / #{user2}")
