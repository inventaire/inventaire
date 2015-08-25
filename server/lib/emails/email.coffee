CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
qs = require 'querystring'
checkUserNotificationsSettings = require './check_user_notifications_settings'

host = CONFIG.fullPublicHost()
{ i18n } = require './i18n/i18n'
base =
  from: 'Inventaire.io <hello@inventaire.io>'

module.exports =
  validationEmail: (user, token)->
    # purposedly not checking notifications settings
    {username, email, language} = user
    return _.extend {}, base,
      to: email
      subject: i18n language, 'email_confirmation_subject'
      template: 'validation_email'
      context:
        lang: user.language
        user: user
        href: buildTokenUrl 'validation-email', email, token

  resetPassword: (user, token)->
    # purposedly not checking notifications settings
    {username, email, language} = user
    return _.extend {}, base,
      to: email
      subject: i18n language, 'reset_password_subject'
      template: 'reset_password'
      context:
        lang: user.language
        user: user
        href: buildTokenUrl 'reset-password', email, token


  friendAcceptedRequest: (options)->
    [user1, user2] = validateOptions options

    checkUserNotificationsSettings user1, 'friend_accepted_request'

    return _.extend {}, base,
      to: user1.email
      subject: i18n(user1.language, 'friend_accepted_request_subject', user2)
      template: 'friend_accepted_request'
      context:
        user: user1
        lang: user1.language
        friend: user2
        host: host

  friendshipRequest: (options)->
    [user1, user2] = validateOptions options

    checkUserNotificationsSettings user1, 'friendship_request'

    return _.extend {}, base,
      to: user1.email
      subject: i18n(user1.language, 'friendship_request_subject', user2)
      template: 'friendship_request'
      context:
        user: user1
        lang: user1.language
        otherUser: user2
        host: host

  group: (action, context)->
    { group, actingUser, userToNotify } = context
    { language, email } = userToNotify

    checkUserNotificationsSettings userToNotify, "group_#{action}"

    groupContext =
      groupName: group.name
      actingUserUsername: actingUser.username

    return _.extend {}, base,
      to: email
      subject: i18n(language, "group_#{action}_subject", groupContext)
      template: 'group'
      context:
        title: "group_#{action}_subject"
        button: "group_#{action}_button"
        group: group
        groupContext: groupContext
        lang: language
        host: host

  feedback: (subject, message, user, unknownUser)->
    # no email settings to check here ;)
    return _.extend {}, base,
      to: base.from
      replyTo: user?.email
      subject: "[feedback] #{subject}"
      template: 'feedback'
      context:
        subject: subject
        message: message
        user: user
        unknownUser: unknownUser

  transactions:
    yourItemWasRequested: (transaction)->
      transactionEmail transaction, 'owner', 'your_item_was_requested'

    updateOnYourItem: (transaction)->
      transactionEmail transaction, 'owner', 'update_on_your_item'

    updateOnItemYouRequested: (transaction)->
      transactionEmail transaction, 'requester', 'update_on_item_you_requested'

transactionEmail = (transaction, role, label)->
  checkUserNotificationsSettings transaction.mainUser, label
  other = if role is 'owner' then 'requester' else 'owner'
  titleContext =
    username: transaction[other].username
    title: transaction.item.title
  return _.extend {}, base,
    to: transaction[role].email
    subject: i18n(transaction[role].language, "#{label}_title", titleContext)
    template: 'transaction_update'
    context: _.extend transaction,
      host: host
      link: "#{host}/transactions/#{transaction._id}"
      title: transaction.item.title
      username: transaction.other.username
      subject: "#{label}_subject"
      button: "#{label}_button"
      lang: transaction.mainUser.language

validateOptions = (options)->
  {user1, user2} = options
  _.types [user1, user2], 'objects...'
  unless user1.email? then throw new Error "missing user1 email"
  unless user2.username? then throw new Error "missing user2 username"
  return [user1, user2]

buildTokenUrl = (action, email, token)->
  _.buildPath "#{host}/api/auth/public/token",
    action: action
    email: email
    token: token
