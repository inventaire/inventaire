import { map, sample } from 'lodash-es'
import { getPendingGroupInvitationsCount, getPendingGroupRequestsCount } from '#controllers/groups/lib/counts'
import { getUnreadNotificationsCount } from '#controllers/notifications/lib/notifications'
import { getPendingFriendsRequestsCount } from '#controllers/relations/lib/queries'
import { getUserActiveTransactionsCount } from '#controllers/transactions/lib/transactions'
import { objectPromise } from '#lib/promises'
import { shortLang } from '#lib/utils/base'
import config from '#server/config'
import type { User } from '#types/user'
import { i18n } from '../i18n/i18n.js'
import { getLastNearbyPublicBooks } from './last_nearby_books.js'
import { getLastNetworkBooks } from './last_network_books.js'

const host = config.getPublicOrigin()
const { contactAddress } = config
const { newsKey, didYouKnowKeys } = config.activitySummary
// keep in sync with the nextSummary view in the user design_docs
// and defaultPeriodicity in the client's notifications_settings
const defaultPeriodicity = 20

export default (user: User) => {
  return getEmailData(user)
  .then(filterOutDuplicatedItems)
  .then(spreadEmailData(user))
}

function getEmailData (user: User) {
  const { _id: userId, language, lastSummary } = user
  const lang = shortLang(language)
  return objectPromise({
    // pending friends requests
    friendsRequests: getPendingFriendsRequestsCount(userId),
    // pending group invitation
    groupInvitations: getPendingGroupInvitationsCount(userId),
    groupRequests: getPendingGroupRequestsCount(userId),
    // unread notifications
    unreadNotifications: getUnreadNotificationsCount(userId),
    // waiting transaction
    activeTransactions: getUserActiveTransactionsCount(userId),
    // new books in your network: preview + count for others 'X more...'
    lastFriendsBooks: getLastNetworkBooks(userId, lang, lastSummary),
    // new books nearby
    lastNearbyPublicBooks: getLastNearbyPublicBooks(user, lastSummary),
  })
}

// FUTURE TODO
// waiting transaction
// where you have an action to do
// where you have been waiting for the other's action for long now
// new users nearby
// new users in groups

function filterOutDuplicatedItems (results) {
  const { lastFriendsBooks, lastNearbyPublicBooks } = results
  const lastFriendsBooksIds = map(lastFriendsBooks.highlighted, '_id')
  lastNearbyPublicBooks.highlighted = lastNearbyPublicBooks.highlighted
    .filter(item => !lastFriendsBooksIds.includes(item._id))
  return results
}

const spreadEmailData = (user: User) => results => {
  const {
    friendsRequests,
    groupInvitations,
    groupRequests,
    unreadNotifications,
    activeTransactions,
    lastFriendsBooks,
    lastNearbyPublicBooks,
  } = results

  const { email, language } = user
  const lang = shortLang(language)

  const countTotal = friendsRequests +
    groupInvitations +
    groupRequests +
    unreadNotifications +
    activeTransactions +
    lastFriendsBooks.highlighted.length +
    lastNearbyPublicBooks.highlighted.length

  const periodicity = user.summaryPeriodicity || defaultPeriodicity

  const news = newsData(user)

  // Prevent sending an empty activity summary
  if (news.display === false && countTotal === 0) return

  // Attach the lang to make accessible for the last_books partial
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
        contactAddress,
      },
      friendsRequests: counter(friendsRequests, '/network/friends'),
      groupInvitations: counter(groupInvitations, '/network/groups'),
      groupRequests: counter(groupRequests, '/notifications'),
      unreadNotifications: counter(unreadNotifications, '/notifications'),
      activeTransactions: counter(activeTransactions, '/transactions'),
      lastFriendsBooks,
      lastNearbyPublicBooks,
      news,
      didYouKnowKey: getDidYouKnowKey(),
      hasActivities: countTotal > 0,
    },
  }
}

const counter = (count, path) => ({
  display: count > 0,
  smart_count: count,
  href: host + path,
})

function newsData (user) {
  const { lastNews } = user
  if (lastNews !== newsKey) {
    return { display: true, key: newsKey }
  } else {
    return { display: false }
  }
}

function getDidYouKnowKey () {
  const num = sample(didYouKnowKeys)
  return `did_you_know_${num}`
}
