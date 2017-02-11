CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
groups_ = __.require 'controllers', 'groups/lib/groups'
generateFeedFromFeedData = require './lib/generate_feed_from_feed_data'
headers_ = __.require 'lib', 'headers'

module.exports =
  get: (req, res, next)->
    { query } = req
    { user:userId, group:groupId } = query

    if userId?
      unless _.isUserId userId
        return error_.bundle req, res, 'invalid user id', 400

      feedDataPromise = userFeedData userId

    else if groupId?
      unless _.isGroupId groupId
        return error_.bundle req, res, 'invalid group id', 400

      feedDataPromise = groupFeedData groupId

    else
      return error_.bundle req, res, 'missing id', 400

    # Guess the lang from the query string or from the request headers
    # that might be passed by the feeds aggregator
    lang = req.query.lang or headers_.getReqLang(req)

    feedDataPromise
    .then generateFeedFromFeedData(lang)
    .then res.send.bind(res)
    .catch error_.Handler(req, res)

userFeedData = (userId)->
  user_.byId userId
  .then (user)->
    users: [ user ]
    feedOptions:
      title: user.username
      description: user.bio
      image: user.picture
      queryString: "user=#{user._id}"
      pathname: "inventory/#{user._id}"

groupFeedData = (groupId)->
  groups_.byId groupId
  .then (group)->
    getGroupMembers group
    .then (users)->
      users: users
      feedOptions:
        title: group.name
        description: group.description
        image: group.picture
        queryString: "group=#{group._id}"
        pathname: "groups/#{group._id}"

getGroupMembers = (group)->
  { admins, members } = group
  userIds = admins.concat(members).map _.property('user')
  return user_.byIds userIds
