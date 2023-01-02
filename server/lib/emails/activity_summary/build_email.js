import CONFIG from 'config'
import _ from '#builders/utils'
import promises_ from '#lib/promises'
import relations_ from '#controllers/relations/lib/queries'
import groupsCounts from '#controllers/groups/lib/counts'
import notifications_ from '#controllers/notifications/lib/notifications'
import transactions_ from '#controllers/transactions/lib/transactions'
import { i18n } from '../i18n/i18n.js'
import getLastNetworkBooks from './last_network_books.js'
import getLastNearbyPublicBooks from './last_nearby_books.js'

const host = CONFIG.getPublicOrigin()
const { contactAddress } = CONFIG
const { newsKey, didYouKnowKeys } = CONFIG.activitySummary
// keep in sync with the nextSummary view in the user design_docs
// and defaultPeriodicity in the client's notifications_settings
const defaultPeriodicity = 20

export default user => {
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
    groupInvitations: groupsCounts.pendingGroupInvitationsCount(userId),
    groupRequests: groupsCounts.pendingGroupRequestsCount(userId),
    // unread notifications
    unreadNotifications: notifications_.unreadCount(userId),
    // waiting transaction
    activeTransactions: transactions_.activeTransactionsCount(userId),
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
    return { display: true, key: newsKey }
  } else {
    return { display: false }
  }
}

const getDidYouKnowKey = () => {
  const num = _.sample(didYouKnowKeys)
  return `did_you_know_${num}`
}
