// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const headers_ = __.require('lib', 'headers')
const getAuthentifiedUser = require('./lib/get_authentified_user')
const userFeedData = require('./lib/user_feed_data')
const groupFeedData = require('./lib/group_feed_data')
const generateFeedFromFeedData = require('./lib/generate_feed_from_feed_data')

module.exports = {
  get(req, res, next){
    let feedDataPromise
    const { query } = req
    const { user:userId, group:groupId, requester, token } = query

    if (requester != null) {
      if (token == null) return error_.bundleMissingQuery(req, res, 'token')
    } else {
      if (token != null) return error_.bundleMissingQuery(req, res, 'requester')
    }

    // The reason to have this authentifying token system on a public endpoint
    // is that relying on the general 'restrictApiAccess' middleware
    // would have implyied creating a general token authentification strategy,
    // but with a lower authorization level (only read operations), and for
    // a limitied amount of whitelisted routes.
    // It is way easier to simply have this ad-hoc token authentification strategy
    // that we know opens only the limited rights we wish it to open.
    const authentifiedUserPromise = getAuthentifiedUser(requester, token)

    if (userId != null) {
      if (!_.isUserId(userId)) {
        return error_.bundleInvalid(req, res, 'user', userId)
      }

      feedDataPromise = userFeedData(userId, authentifiedUserPromise)

    } else if (groupId != null) {
      if (!_.isGroupId(groupId)) {
        return error_.bundleInvalid(req, res, 'group', groupId)
      }

      feedDataPromise = groupFeedData(groupId, authentifiedUserPromise)

    } else {
      return error_.bundleMissingQuery(req, res, 'user|group', 400)
    }

    // Guess the lang from the query string or from the request headers
    // that might be passed by the feeds aggregator
    const lang = req.query.lang || headers_.getReqLang(req)

    return feedDataPromise
    .then(generateFeedFromFeedData(lang))
    .then(res.send.bind(res))
    .catch(error_.Handler(req, res))
  }
}
