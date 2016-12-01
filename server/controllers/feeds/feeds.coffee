CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
root = CONFIG.fullPublicHost()
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
Rss = require 'rss'
limit = 100

module.exports =
  get: (req, res, next)->
    feed = new Rss {"title":"New Public Items"}
    { query } = req
    items_.publicByDate limit
    .then (items) -> rssSerializer(feed, items)
    .then -> res.send(feed.xml())
    .catch error_.Handler(req, res)

rssSerializer = (feed, items)->
  items.map (item)->
    title: item.title
    guid: item._id
    url: "#{root}/items/#{item._id}"
    author: item.authors
    date: item.updated
  .map feed.item.bind(feed)

