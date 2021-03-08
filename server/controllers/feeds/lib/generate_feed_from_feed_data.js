const CONFIG = require('config')
const __ = require('config').universalPath
const _ = require('builders/utils')
const { feed: feedConfig } = CONFIG
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const serializeFeed = require('./serialize_feed')
const getItemsByAccessLevel = require('controllers/items/lib/get_by_access_level')
const getAuthorizedItems = require('controllers/items/lib/get_authorized_items')
const user_ = require('controllers/user/lib/user')

module.exports = lang => async ({ accessLevel, reqUserId, feedOptions, users, shelves }) => {
  users = users.map(user_.serializeData)
  const usersIds = _.map(users, '_id')
  let items
  if (shelves) {
    items = await getAuthorizedItems.byShelves(shelves, reqUserId)
  } else {
    items = await getLastItemsFromUsersIds(usersIds, accessLevel)
  }
  return serializeFeed(feedOptions, users, items, lang)
}

const getLastItemsFromUsersIds = async (usersIds, accessLevel) => {
  let items = await getItemsByAccessLevel[accessLevel](usersIds)
  items = extractLastItems(items)
  return Promise.all(items.map(snapshot_.addToItem))
}

const extractLastItems = items => {
  return items
  .sort((a, b) => b.created - a.created)
  .slice(0, feedConfig.limitLength)
}
