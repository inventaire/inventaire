// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const host = CONFIG.fullPublicHost()
const { i18n } = require('../i18n/i18n')
const { contactAddress } = CONFIG
const { newsKey, didYouKnowKeyCount } = CONFIG.activitySummary
// keep in sync with the nextSummary view in the user design_docs
// and defaultPeriodicity in the client's notifications_settings
const defaultPeriodicity = 20

const relations_ = __.require('controllers', 'relations/lib/queries')
const groups_ = __.require('controllers', 'groups/lib/groups')
const notifs_ = __.require('lib', 'notifications')
const transactions_ = __.require('controllers', 'transactions/lib/transactions')

const getLastNetworkBooks = require('./last_network_books')
const getLastNearbyPublicBooks = require('./last_nearby_books')

module.exports = user => {
  user.lang = _.shortLang(user.language)

  return getEmailData(user)
  .then(filterOutDuplicatedItems)
  .then(spreadEmailData(user))
}

const getEmailData = user => {
  const { _id: userId, lang, lastSummary } = user
  return promises_.props({
    // pending friends requests
    friendsRequests: relations_.pendingFriendsRequestsCount(userId),
    // pending group invitation
    groupInvitations: groups_.pendingGroupInvitationsCount(userId),
    groupRequests: groups_.pendingGroupRequestsCount(userId),
    // unread notifications
    unreadNotifications: notifs_.unreadCount(userId),
    // waiting transaction
    activeTransactions: transactions_.activeTransactions(userId),
    // new books in your network: preview + count for others 'X more...'
    lastFriendsBooks: getLastNetworkBooks(userId, lang, lastSummary),
    // new books nearby
    lastNearbyPublicBooks: getLastNearbyPublicBooks(user, lastSummary)
  })
}

// FUTURE TODO
// waiting transaction
// where you have an action to do
// where you have been waiting for the other's action for long now
// new users nearby
// new users in groups

const filterOutDuplicatedItems = results => {
  const { lastFriendsBooks, lastNearbyPublicBooks } = results
  const lastFriendsBooksIds = _.map(lastFriendsBooks.highlighted, '_id')
  lastNearbyPublicBooks.highlighted = lastNearbyPublicBooks.highlighted
    .filter(item => !lastFriendsBooksIds.includes(item._id))
  return results
}

const spreadEmailData = user => results => {
  const {
    friendsRequests,
    groupInvitations,
    groupRequests,
    unreadNotifications,
    activeTransactions,
    lastFriendsBooks,
    lastNearbyPublicBooks
  } = results

  const { email, lang } = user

  const countTotal = friendsRequests +
    groupInvitations +
    groupRequests +
    unreadNotifications +
    activeTransactions +
    lastFriendsBooks.highlighted.length +
    lastNearbyPublicBooks.highlighted.length

  const periodicity = user.summaryPeriodicity || defaultPeriodicity

  const news = newsData(user)

  if ((news.display === false) && (countTotal === 0)) {
    throw promises_.skip('empty activity summary', user._id)
  }

  // attach the lang to make accessible for the last_books partial
  lastFriendsBooks.lang = lang
  lastNearbyPublicBooks.lang = lang

  return {
    to: email,
    subject: i18n(lang, 'activity_summary_title'),
    template: 'activity_summary',
    context: {
      user,
      lang,
      meta: {
        host,
        periodicity,
        settingsHref: `${host}/settings/notifications`,
        contactAddress
      },
      friendsRequests: counter(friendsRequests, '/network/friends'),
      groupInvitations: counter(groupInvitations, '/network/groups'),
      groupRequests: counter(groupRequests, '/network/groups'),
      unreadNotifications: counter(unreadNotifications, '/notifications'),
      activeTransactions: counter(activeTransactions, '/transactions'),
      lastFriendsBooks,
      lastNearbyPublicBooks,
      news,
      didYouKnowKey: getDidYouKnowKey(),
      hasActivities: countTotal > 0
    }
  }
}

const counter = (count, path) => ({
  display: count > 0,
  smart_count: count,
  href: host + path
})

const newsData = user => {
  const { lastNews } = user
  if (lastNews !== newsKey) {
    return {
      display: true,
      key: newsKey
    }
  } else {
    return { display: false }
  }
}

const getDidYouKnowKey = () => {
  const num = _.random(1, didYouKnowKeyCount)
  return `did_you_know_${num}`
}
