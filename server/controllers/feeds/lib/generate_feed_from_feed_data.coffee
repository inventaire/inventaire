CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ feed:feedConfig } = CONFIG
items_ = __.require 'controllers', 'items/lib/items'
snapshot_ = __.require 'controllers', 'items/lib/snapshot/snapshot'
serializeFeed = require './serialize_feed'
getItemsByAccessLevel = __.require 'controllers', 'items/lib/get_by_access_level'

module.exports = (lang)-> (feedData)->
  { users, accessLevel, feedOptions } = feedData
  usersIds = users.map _.property('_id')
  getLastItemsFromUsersIds usersIds, accessLevel
  .then (items)-> serializeFeed feedOptions, users, items, lang

getLastItemsFromUsersIds = (usersIds, accessLevel)->
  getItemsByAccessLevel[accessLevel](usersIds)
  .then extractLastItems
  .map snapshot_.addToItem

extractLastItems = (items)->
  items
  .sort (a, b)-> b.created - a.created
  .slice 0, feedConfig.limitLength
