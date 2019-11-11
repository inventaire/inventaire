CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
headers_ = __.require 'lib', 'headers'
getAuthentifiedUser = require './lib/get_authentified_user'
userFeedData = require './lib/user_feed_data'
groupFeedData = require './lib/group_feed_data'
generateFeedFromFeedData = require './lib/generate_feed_from_feed_data'

module.exports =
  get: (req, res, next)->
    { query } = req
    { user:userId, group:groupId, requester, token } = query

    if requester?
      unless token? then return error_.bundleMissingQuery req, res, 'token'
    else
      if token? then return error_.bundleMissingQuery req, res, 'requester'

    # The reason to have this authentifying token system on a public endpoint
    # is that relying on the general 'restrictApiAccess' middleware
    # would have implyied creating a general token authentification strategy,
    # but with a lower authorization level (only read operations), and for
    # a limitied amount of whitelisted routes.
    # It is way easier to simply have this ad-hoc token authentification strategy
    # that we know opens only the limited rights we wish it to open.
    authentifiedUserPromise = getAuthentifiedUser requester, token

    if userId?
      unless _.isUserId userId
        return error_.bundleInvalid req, res, 'user', userId

      feedDataPromise = userFeedData userId, authentifiedUserPromise

    else if groupId?
      unless _.isGroupId groupId
        return error_.bundleInvalid req, res, 'group', groupId

      feedDataPromise = groupFeedData groupId, authentifiedUserPromise

    else
      return error_.bundleMissingQuery req, res, 'user|group', 400

    # Guess the lang from the query string or from the request headers
    # that might be passed by the feeds aggregator
    lang = req.query.lang or headers_.getReqLang(req)

    feedDataPromise
    .then generateFeedFromFeedData(lang)
    .then res.send.bind(res)
    .catch error_.Handler(req, res)
