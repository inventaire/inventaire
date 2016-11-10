__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
RSS = require 'rss'

module.exports =
  get: (req, res, next)->
    { query } = req
    feed = new RSS({"title":"New Public Items"})
    limit = 100
    items = items_.publicByDate limit
    .then (items)->
      items.map (item)->
        xmlItem = {}
        xmlItem["title"] = item["title"]
        xmlItem["guid"] = item["entity"]
        xmlItem["url"] = item["_id"]
        xmlItem["author"] = item["authors"]
        xmlItem["date"] = item["updated"]
        return xmlItem
    .then (xmlItems)->
      for item in xmlItems
        feed.item(item)
    .then -> res.send(feed.xml())
    .catch error_.Handler(req, res)

