CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ feed:feedConfig } = CONFIG
items_ = __.require 'controllers', 'items/lib/items'
serializeFeed = require './serialize_feed'

module.exports = (lang)-> (feedData)->
  { users, feedOptions } = feedData
  userIds = users.map _.property('_id')
  getLastItemsFromUserIds userIds
  .then (items)-> serializeFeed feedOptions, users, items, lang

getLastItemsFromUserIds = (userIds)->
  items_.publicListings userIds
  .then extractLastItems

extractLastItems = (items)->
  items
  .sort (a, b)-> b.created - a.created
  .slice 0, feedConfig.limitLength
