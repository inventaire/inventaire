
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const qs = require('querystring')
const checkUserNotificationsSettings = require('./check_user_notifications_settings')

const host = CONFIG.fullPublicHost()
const { defaultFrom } = CONFIG.mailer
const { i18n } = require('./i18n/i18n')
const { kmBetween } = __.require('lib', 'geo')

module.exports = {
  validationEmail: (user, token) => {
    // purposedly not checking notifications settings
    const { email, language } = user
    const lang = _.shortLang(language)
    const href = buildTokenUrl('validation-email', email, token)

    return {
      to: email,
      subject: i18n(lang, 'email_confirmation_subject'),
      template: 'validation_email',
      context: { lang, user, href }
    }
  },

  resetPassword: (user, token) => {
    // purposedly not checking notifications settings
    const { email, language } = user
    const lang = _.shortLang(language)
    const href = buildTokenUrl('reset-password', email, token)

    return {
      to: email,
      subject: i18n(lang, 'reset_password_subject'),
      template: 'reset_password',
      context: { lang, user, href }
    }
  },

  friendAcceptedRequest: options => {
    const [ user1, user2 ] = Array.from(validateOptions(options))
    const lang = _.shortLang(user1.language)

    checkUserNotificationsSettings(user1, 'friend_accepted_request')

    return {
      to: user1.email,
      subject: i18n(lang, 'friend_accepted_request_subject', user2),
      template: 'friend_accepted_request',
      context: { user: user1, friend: user2, lang, host }
    }
  },

  friendshipRequest: options => {
    const [ user1, user2 ] = Array.from(validateOptions(options))
    const lang = _.shortLang(user1.language)

    checkUserNotificationsSettings(user1, 'friendship_request')

    user2.href = `${host}/inventory/${user2.username}`

    let { bio } = user2
    if (bio == null) { bio = '' }
    if (bio.length > 200) { bio = `${bio.slice(0, 201)}...` }
    user2.bio = bio

    if ((user1.position != null) && (user2.position != null)) {
      user2.distance = kmBetween(user1.position, user2.position)
    }

    return {
      to: user1.email,
      subject: i18n(lang, 'friendship_request_subject', user2),
      template: 'friendship_request',
      context: { user: user1, otherUser: user2, lang, host }
    }
  },

  group: (action, context) => {
    const { group, actingUser, userToNotify } = context
    const { language, email } = userToNotify
    const lang = _.shortLang(language)

    checkUserNotificationsSettings(userToNotify, `group_${action}`)

    const groupContext = {
      groupName: group.name,
      actingUserUsername: actingUser.username
    }

    const title = `group_${action}_subject`
    const button = `group_${action}_button`

    return {
      to: email,
      subject: i18n(lang, `group_${action}_subject`, groupContext),
      template: 'group',
      context: { title, button, group, groupContext, lang, host }
    }
  },

  feedback: (subject, message, user, unknownUser, uris, context) => {
    // no email settings to check here ;)
    const username = (user != null ? user.username : undefined) || 'anonymous'
    return {
      to: defaultFrom,
      replyTo: (user != null ? user.email : undefined),
      subject: `[feedback][${username}] ${subject}`,
      template: 'feedback',
      context: { subject, message, user, unknownUser, uris, host, context }
    }
  },

  FriendInvitation: (inviter, message) => {
    // No email settings to check here:
    // - Existing users aren't sent an email invitation but get a friend request
    //   where their notifications settings will be applied
    // - Invited users who don't want more emails should have been filtered-out
    //   by invitations/lib/send_invitations extractCanBeInvited
    const { username, language } = inviter
    const lang = _.shortLang(language)

    inviter.pathname = `${host}/users/${username}`
    return emailAddress => {
      return {
        to: emailAddress,
        replyTo: inviter.email,
        subject: i18n(lang, 'email_invitation_subject', inviter),
        template: 'email_invitation',
        context: { inviter, message, lang, host }
      }
    }
  },

  GroupInvitation: (inviter, group, message) => {
    // No email settings to check here neither (idem FriendInvitation)
    const { language } = inviter
    const lang = _.shortLang(language)

    group.pathname = `${host}/groups/${group.slug}`
    // Object required to pass as i18n strings context
    return emailAddress => ({
      to: emailAddress,
      replyTo: inviter.email,
      subject: i18n(lang, 'group_email_invitation_subject'),
      template: 'group_email_invitation',
      context: { message, lang, host }
    })
  },

  transactions: {
    yourItemWasRequested: transaction => {
      return transactionEmail(transaction, 'owner', 'your_item_was_requested')
    },

    updateOnYourItem: transaction => {
      return transactionEmail(transaction, 'owner', 'update_on_your_item')
    },

    updateOnItemYouRequested: transaction => {
      return transactionEmail(transaction, 'requester', 'update_on_item_you_requested')
    }
  }
}

const transactionEmail = (transaction, role, label) => {
  checkUserNotificationsSettings(transaction.mainUser, label)
  const other = role === 'owner' ? 'requester' : 'owner'
  const lang = _.shortLang(transaction.mainUser.language)

  const titleContext = {
    username: transaction[other].username,
    title: transaction.item.title
  }
  return {
    to: transaction[role].email,
    subject: i18n(lang, `${label}_title`, titleContext),
    template: 'transaction_update',
    context: Object.assign(transaction, {
      host,
      link: `${host}/transactions/${transaction._id}`,
      title: transaction.item.title,
      username: transaction.other.username,
      subject: `${label}_subject`,
      button: `${label}_button`,
      lang
    })

  }
}

const validateOptions = options => {
  const { user1, user2 } = options
  assert_.objects([ user1, user2 ])
  if (user1.email == null) throw new Error('missing user1 email')
  if (user2.username == null) throw new Error('missing user2 username')
  return [ user1, user2 ]
}

const buildTokenUrl = (action, email, token) => _.buildPath(`${host}/api/token`, { action, email: qs.escape(email), token })
