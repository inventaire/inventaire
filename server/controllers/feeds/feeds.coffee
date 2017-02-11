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
      unless token? then return error_.bundle req, res, 'missing token', 400
    else
      if token? then return error_.bundle req, res, 'missing requester id', 400

    authentifiedUserPromise = getAuthentifiedUser requester, token

    if userId?
      unless _.isUserId userId
        return error_.bundle req, res, 'invalid user id', 400

      feedDataPromise = userFeedData userId, authentifiedUserPromise

    else if groupId?
      unless _.isGroupId groupId
        return error_.bundle req, res, 'invalid group id', 400

      feedDataPromise = groupFeedData groupId, authentifiedUserPromise

    else
      return error_.bundle req, res, 'missing id', 400

    # Guess the lang from the query string or from the request headers
    # that might be passed by the feeds aggregator
    lang = req.query.lang or headers_.getReqLang(req)

    feedDataPromise
    .then generateFeedFromFeedData(lang)
    .then res.send.bind(res)
    .catch error_.Handler(req, res)
