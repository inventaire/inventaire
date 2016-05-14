CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
qs = require 'querystring'
checkUserNotificationsSettings = require './check_user_notifications_settings'

host = CONFIG.fullPublicHost()
{ defaultFrom } = CONFIG.mailer
{ i18n } = require './i18n/i18n'
{ kmBetween } = __.require 'lib', 'geo'

module.exports =
  validationEmail: (user, token)->
    # purposedly not checking notifications settings
    { username, email, language } = user
    lang = _.shortLang language

    return data =
      to: email
      subject: i18n lang, 'email_confirmation_subject'
      template: 'validation_email'
      context:
        lang: lang
        user: user
        href: buildTokenUrl 'validation-email', email, token

  resetPassword: (user, token)->
    # purposedly not checking notifications settings
    { username, email, language } = user
    lang = _.shortLang language

    return data =
      to: email
      subject: i18n lang, 'reset_password_subject'
      template: 'reset_password'
      context:
        lang: lang
        user: user
        href: buildTokenUrl 'reset-password', email, token


  friendAcceptedRequest: (options)->
    [ user1, user2 ] = validateOptions options
    lang = _.shortLang user1.language

    checkUserNotificationsSettings user1, 'friend_accepted_request'

    return data =
      to: user1.email
      subject: i18n lang, 'friend_accepted_request_subject', user2
      template: 'friend_accepted_request'
      context:
        user: user1
        lang: lang
        friend: user2
        host: host

  friendshipRequest: (options)->
    [ user1, user2 ] = validateOptions options
    lang = _.shortLang user1.language

    checkUserNotificationsSettings user1, 'friendship_request'

    user2.href = "#{host}/inventory/#{user2.username}"

    { bio } = user2
    if bio.length > 200 then bio = bio[0..200] + '...'
    user2.bio = bio

    if user1.position? and user2.position?
      user2.distance = kmBetween user1.position, user2.position

    return data =
      to: user1.email
      subject: i18n lang, 'friendship_request_subject', user2
      template: 'friendship_request'
      context:
        user: user1
        lang: lang
        otherUser: user2
        host: host

  group: (action, context)->
    { group, actingUser, userToNotify } = context
    { language, email } = userToNotify
    lang = _.shortLang language

    checkUserNotificationsSettings userToNotify, "group_#{action}"

    groupContext =
      groupName: group.name
      actingUserUsername: actingUser.username

    return data =
      to: email
      subject: i18n lang, "group_#{action}_subject", groupContext
      template: 'group'
      context:
        title: "group_#{action}_subject"
        button: "group_#{action}_button"
        group: group
        groupContext: groupContext
        lang: lang
        host: host

  feedback: (subject, message, user, unknownUser)->
    # no email settings to check here ;)
    username = user?.username or 'anonymous'
    return data =
      to: defaultFrom
      replyTo: user?.email
      subject: "[feedback][#{username}] #{subject}"
      template: 'feedback'
      context:
        subject: subject
        message: message
        user: user
        unknownUser: unknownUser

  EmailInvitation: (user, message)->
    # no email settings to check here neither:
    # invited users who don't want more emails should have been filtered-out
    # by invitations_.extractCanBeInvited
    { username, language } = user
    lang = _.shortLang language

    user.pathname = "#{host}/inventory/#{username}"
    return emailFactory = (emailAddress)->
      return data =
        to: emailAddress
        replyTo: user.email
        subject: i18n lang, 'email_invitation_subject', user
        template: 'email_invitation'
        context:
          user: user
          message: message
          lang: lang
          host: host

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
  lang = _.shortLang transaction.mainUser.language

  titleContext =
    username: transaction[other].username
    title: transaction.item.title
  return data =
    to: transaction[role].email
    subject: i18n lang, "#{label}_title", titleContext
    template: 'transaction_update'
    context: _.extend transaction,
      host: host
      link: "#{host}/transactions/#{transaction._id}"
      title: transaction.item.title
      username: transaction.other.username
      subject: "#{label}_subject"
      button: "#{label}_button"
      lang: lang

validateOptions = (options)->
  { user1, user2 } = options
  _.types [user1, user2], 'objects...'
  unless user1.email? then throw new Error "missing user1 email"
  unless user2.username? then throw new Error "missing user2 username"
  return [user1, user2]

buildTokenUrl = (action, email, token)->
  _.buildPath "#{host}/api/auth/public/token",
    action: action
    email: qs.escape email
    token: token
