const _ = require('builders/utils')
const { feed: feedConfig } = require('config')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const serializeFeed = require('./serialize_feed')
const getAuthorizedItems = require('controllers/items/lib/get_authorized_items')
const user_ = require('controllers/user/lib/user')
const { filterPrivateAttributes } = require('controllers/items/lib/filter_private_attributes')
const { paginate } = require('controllers/items/lib/queries_commons')

module.exports = lang => async ({ reqUserId, feedOptions, users, shelves, filter }) => {
  users = users.map(user_.serializeData)
  const usersIds = _.map(users, '_id')
  let items
  if (shelves) {
    items = await getAuthorizedItems.byShelves(shelves, reqUserId)
  } else {
    items = await getAuthorizedItems.byUsers(usersIds, reqUserId)
  }
  const page = paginate(items, {
    filter,
    limit: feedConfig.limitLength,
  })
  items = await Promise.all(page.items.map(snapshot_.addToItem))
  items = items.map(filterPrivateAttributes(reqUserId))
  return serializeFeed(feedOptions, users, items, lang)
}
