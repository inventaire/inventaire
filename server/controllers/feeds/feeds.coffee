CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
groups_ = __.require 'controllers', 'groups/lib/groups'
generateFeedFromFeedData = require './lib/generate_feed_from_feed_data'

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

    feedDataPromise
    .then generateFeedFromFeedData
    .then res.send.bind(res)
    .catch error_.Handler(req, res)

userFeedData = (userId)->
  user_.byId userId
  .then (user)->
    userIds: [ user._id ]
    feedOptions:
      title: user.username
      queryString: "user=#{user._id}"
      pathname: "inventory/#{user._id}"

groupFeedData = (groupId)->
  groups_.byId groupId
  .then (group)->
    userIds: getUserIdsFromGroupDoc group
    feedOptions:
      title: group.name
      queryString: "group=#{group._id}"
      pathname: "network/groups/#{group._id}"

getUserIdsFromGroupDoc = (group)->
  { admins, members } = group
  return admins.concat(members).map _.property('user')
