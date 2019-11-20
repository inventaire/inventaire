
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { feed: feedConfig } = CONFIG
const snapshot_ = __.require('controllers', 'items/lib/snapshot/snapshot')
const serializeFeed = require('./serialize_feed')
const getItemsByAccessLevel = __.require('controllers', 'items/lib/get_by_access_level')

module.exports = lang => feedData => {
  const { users, accessLevel, feedOptions } = feedData
  const usersIds = users.map(_.property('_id'))
  return getLastItemsFromUsersIds(usersIds, accessLevel)
  .then(items => serializeFeed(feedOptions, users, items, lang))
}

const getLastItemsFromUsersIds = (usersIds, accessLevel) => getItemsByAccessLevel[accessLevel](usersIds)
.then(extractLastItems)
.map(snapshot_.addToItem)

const extractLastItems = items => items
.sort((a, b) => b.created - a.created)
.slice(0, feedConfig.limitLength)
