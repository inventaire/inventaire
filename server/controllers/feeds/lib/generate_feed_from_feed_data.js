const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { feed: feedConfig } = CONFIG
const snapshot_ = __.require('controllers', 'items/lib/snapshot/snapshot')
const serializeFeed = require('./serialize_feed')
const getItemsByAuthorizationLevel = __.require('controllers', 'items/lib/get_by_authorization_level')
const user_ = __.require('controllers', 'user/lib/user')
const promises_ = __.require('lib', 'promises')

module.exports = lang => feedData => {
  const { accessLevel, feedOptions } = feedData
  let { users } = feedData
  users = users.map(user_.serializeData)
  const usersIds = _.map(users, '_id')
  return getLastItemsFromUsersIds(usersIds, accessLevel)
  .then(items => serializeFeed(feedOptions, users, items, lang))
}

const getLastItemsFromUsersIds = (usersIds, accessLevel) => {
  return getItemsByAuthorizationLevel[accessLevel](usersIds)
  .then(extractLastItems)
  .then(promises_.map(snapshot_.addToItem))
}

const extractLastItems = items => {
  return items
  .sort((a, b) => b.created - a.created)
  .slice(0, feedConfig.limitLength)
}
