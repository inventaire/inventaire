const __ = require('config').universalPath
const error_ = require('lib/error/error')
const headers_ = require('lib/headers')
const sanitize = require('lib/sanitize/sanitize')
const getAuthentifiedUser = require('./lib/get_authentified_user')
const userFeedData = require('./lib/user_feed_data')
const groupFeedData = require('./lib/group_feed_data')
const shelfFeedData = require('./lib/shelf_feed_data')
const generateFeedFromFeedData = require('./lib/generate_feed_from_feed_data')

const sanitization = {
  user: {
    optional: true
  },
  group: {
    optional: true
  },
  shelf: {
    optional: true
  },
  requester: {
    optional: true
  },
  token: {
    optional: true
  },
  lang: {
    optional: true,
    // Set the defaults manually after having checked req.headers
    default: null
  }
}

module.exports = {
  get: (req, res) => {
    const headersLang = headers_.getLang(req.headers)
    sanitize(req, res, sanitization)
    .then(getFeed(headersLang))
    .then(xml => {
      res.set('content-type', 'application/rss+xml')
      res.send(xml)
    })
    .catch(error_.Handler(req, res))
  }
}

const getFeed = headersLang => async params => {
  const { userId, groupId, shelfId, requesterId, token } = params
  // Guess the lang from the query string or from the request headers
  // that might be passed by the feeds aggregator
  const lang = params.lang || headersLang || 'en'

  if (requesterId) {
    if (token == null) throw error_.newMissingQuery('token')
  } else {
    if (token != null) throw error_.newMissingQuery('requester')
  }

  // The reason to have this authentifying token system on a public endpoint
  // is that relying on the general 'restrictApiAccess' middleware
  // would have implyied creating a general token authentification strategy,
  // but with a lower authorization level (only read operations), and for
  // a limitied amount of allowlisted routes.
  // It is way easier to simply have this ad-hoc token authentification strategy
  // that we know opens only the limited rights we wish it to open.
  const authentifiedUser = await getAuthentifiedUser(requesterId, token)
  const reqUserId = authentifiedUser ? authentifiedUser._id : null

  return getFeedData({ userId, groupId, shelfId, reqUserId })
  .then(generateFeedFromFeedData(lang))
}

const getFeedData = ({ userId, groupId, shelfId, reqUserId }) => {
  if (userId) return userFeedData(userId, reqUserId)
  else if (groupId) return groupFeedData(groupId, reqUserId)
  else if (shelfId) return shelfFeedData(shelfId, reqUserId)
  else throw error_.newMissingQuery('user|group|shelf', 400)
}
