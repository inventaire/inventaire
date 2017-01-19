CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
root = CONFIG.fullPublicHost()
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
groups_ = __.require 'controllers', 'groups/lib/groups'
Rss = require 'rss'

rssLimitLength = 50

module.exports =
  get: (req, res, next)->
    { query } = req
    { user:userId, group:groupId } = query

    if userId?
      unless _.isUserId userId
        throw error_.bundle req, res, 'invalid user id', 400

      userIdsPromise = user_.byId userId

    else if groupId?
      unless _.isGroupId groupId
        throw error_.bundle req, res, 'invalid group id', 400

      userIdsPromise = findUsersByGroup groupId

    else
      throw error_.bundle req, res, 'missing id', 400

    userIdsPromise
    .then items_.publicListings
    .then extractLastItems
    .then rssSerializer
    .then res.send.bind(res)
    .catch error_.Handler(req, res)

findUsersByGroup = (groupId)->
  groups_.byId groupId
  .then (group)->
    { admins, members } = group
    admins.concat members
    .map _.property('user')

extractLastItems = (items)->
  items
  .sort (a, b)-> a.updated > b.updated
  .slice 0, rssLimitLength

rssSerializer = (items)->
  feed = new Rss
  feed.title = 'New Public Items'
  items.map (item)->
    title: item.title
    guid: item._id
    url: "#{root}/items/#{item._id}"
    author: item.authors
    date: item.updated
  .map feed.item.bind(feed)
  return feed.xml()
