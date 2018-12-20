CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
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
    href = buildTokenUrl 'validation-email', email, token

    return data =
      to: email
      subject: i18n lang, 'email_confirmation_subject'
      template: 'validation_email'
      context: { lang, user, href }

  resetPassword: (user, token)->
    # purposedly not checking notifications settings
    { username, email, language } = user
    lang = _.shortLang language
    href = buildTokenUrl 'reset-password', email, token

    return data =
      to: email
      subject: i18n lang, 'reset_password_subject'
      template: 'reset_password'
      context: { lang, user, href }

  friendAcceptedRequest: (options)->
    [ user1, user2 ] = validateOptions options
    lang = _.shortLang user1.language

    checkUserNotificationsSettings user1, 'friend_accepted_request'

    return data =
      to: user1.email
      subject: i18n lang, 'friend_accepted_request_subject', user2
      template: 'friend_accepted_request'
      context: { user: user1, friend: user2, lang, host }

  friendshipRequest: (options)->
    [ user1, user2 ] = validateOptions options
    lang = _.shortLang user1.language

    checkUserNotificationsSettings user1, 'friendship_request'

    user2.href = "#{host}/inventory/#{user2.username}"

    { bio } = user2
    bio ?= ''
    if bio.length > 200 then bio = bio[0..200] + '...'
    user2.bio = bio

    if user1.position? and user2.position?
      user2.distance = kmBetween user1.position, user2.position

    return data =
      to: user1.email
      subject: i18n lang, 'friendship_request_subject', user2
      template: 'friendship_request'
      context: { user: user1, otherUser: user2, lang, host }

  group: (action, context)->
    { group, actingUser, userToNotify } = context
    { language, email } = userToNotify
    lang = _.shortLang language

    checkUserNotificationsSettings userToNotify, "group_#{action}"

    groupContext =
      groupName: group.name
      actingUserUsername: actingUser.username

    title = "group_#{action}_subject"
    button = "group_#{action}_button"

    return data =
      to: email
      subject: i18n lang, "group_#{action}_subject", groupContext
      template: 'group'
      context: { title, button, group, groupContext, lang, host }

  feedback: (subject, message, user, unknownUser, uris)->
    # no email settings to check here ;)
    username = user?.username or 'anonymous'
    return data =
      to: defaultFrom
      replyTo: user?.email
      subject: "[feedback][#{username}] #{subject}"
      template: 'feedback'
      context: { subject, message, user , unknownUser, uris, host }

  FriendInvitation: (inviter, message)->
    # No email settings to check here:
    # - Existing users aren't sent an email invitation but get a friend request
    #   where their notifications settings will be applied
    # - Invited users who don't want more emails should have been filtered-out
    #   by invitations/lib/send_invitations extractCanBeInvited
    { username, language } = inviter
    lang = _.shortLang language

    inviter.pathname = "#{host}/users/#{username}"
    return emailFactory = (emailAddress)->
      return data =
        to: emailAddress
        replyTo: inviter.email
        subject: i18n lang, 'email_invitation_subject', inviter
        template: 'email_invitation'
        context: { inviter, message, lang, host }

  GroupInvitation: (inviter, group, message)->
    # No email settings to check here neither (idem FriendInvitation)
    { username, language } = inviter
    lang = _.shortLang language

    group.pathname = "#{host}/groups/#{group.slug}"
    # Object required to pass as i18n strings context
    data = { username: inviter.username, groupName: group.name }
    return emailFactory = (emailAddress)->
      return data =
        to: emailAddress
        replyTo: inviter.email
        subject: i18n lang, 'group_email_invitation_subject', data
        template: 'group_email_invitation'
        context: { data, message, lang, host }

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
  assert_.objects [ user1, user2 ]
  unless user1.email? then throw new Error 'missing user1 email'
  unless user2.username? then throw new Error 'missing user2 username'
  return [ user1, user2 ]

buildTokenUrl = (action, email, token)->
  _.buildPath "#{host}/api/token", { action, email: qs.escape(email), token }
