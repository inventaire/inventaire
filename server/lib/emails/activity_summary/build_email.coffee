CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
host = CONFIG.fullPublicHost()
{ i18n } = require '../i18n/i18n'
{ contactAddress } = CONFIG
{ periodicity, newsKey } = CONFIG.activitySummary

user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
groups_ = __.require 'controllers', 'groups/lib/groups'
notifs_ = __.require 'lib', 'notifications'
transactions_ = __.require 'controllers', 'transactions/lib/transactions'

getLastFriendsBooks = require './last_friends_books'

module.exports = (user)->
  getEmailData user
  .then spreadEmailData.bind(null, user)

getEmailData = (user)->
  { _id:userId, lastSummary } = user
  promises_.props
    # pending friends requests
    friendsRequests: relations_.pendingFriendsRequestsCount userId
    # pending group invitation
    groupInvitations: groups_.pendingGroupInvitationsCount userId
    groupRequests: groups_.pendingGroupRequestsCount userId
    # unread notifications
    unreadNotifications: notifs_.unreadCount userId
    # waiting transaction
    activeTransactions: transactions_.activeTransactions userId
    # new books in your network: preview + count for others 'X more...'
    lastFriendsBooks: getLastFriendsBooks userId, lastSummary
    # new users in groups

    # FUTURE TODO
    # waiting transaction
      # where you have an action to do
      # where you have been waiting for the other's action for long now
    # new books nearby
    # new users nearby

spreadEmailData = (user, results)->
  {
    friendsRequests,
    groupInvitations,
    groupRequests,
    unreadNotifications,
    activeTransactions,
    lastFriendsBooks
  } = results

  { email, language } = user
  lang = _.shortLang language

  return data =
    to: email
    subject: i18n lang, 'activity_summary_title'
    template: 'activity_summary'
    context:
      user: user
      lang: lang
      meta:
        host: host
        periodicity: periodicity
        settingsHref: host + '/settings/notifications'
        contactAddress: contactAddress
      friendsRequests: counter friendsRequests, '/network/friends'
      groupInvitations: counter groupInvitations, '/network/groups'
      groupRequests: counter groupRequests, '/network/groups'
      unreadNotifications: counter unreadNotifications, '/notifications'
      activeTransactions: counter activeTransactions, '/transactions'
      lastFriendsBooks: lastFriendsBooks
      news: newsData user

counter = (count, path)->
  display: count > 0
  smart_count: count
  href: host + path

newsData = (user)->
  { lastNews } = user
  if lastNews isnt newsKey
    display: true
    key: 'news_1'
  else
    display: false
