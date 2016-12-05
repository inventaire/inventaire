CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
root = CONFIG.fullPublicHost()
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
Rss = require 'rss'

module.exports =
  get: (req, res, next)->
    { query } = req
    { user:userId } = query

    unless userId?
      throw error_.bundle req, res, 'missing user id', 400

    unless _.isUserId userId
      throw error_.bundle req, res, 'invalid user id', 400

    findUser userId
    .then findItems.bind(null, userId)
    .then rssSerializer
    .then res.send
    .catch error_.Handler(req, res)

findUser = user_.byId

findItems = (userId)->
  items_.publicListings [userId]

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
  feed.xml()
