const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const relations_ = require('controllers/relations/lib/queries')
const { addAssociatedData, Paginate } = require('./lib/queries_commons')

const sanitization = {
  uris: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async params => {
  return getEntitiesItems(params)
  .then(addAssociatedData)
}

const getEntitiesItems = page => {
  const { uris, reqUserId } = page

  return Promise.all([
    getUserItems(reqUserId, uris),
    getNetworkItems(reqUserId, uris),
    items_.publicByEntities(uris)
  ])
  .then(([ userItems, networkItems, publicItems ]) => {
    // Only add user and network keys for the authorized endpoint
    if (reqUserId != null) {
      const dedupPublicItems = deduplicateItems(userItems, networkItems, publicItems)
      return userItems.concat(networkItems).concat(dedupPublicItems)
    } else {
      return publicItems
    }
  })
  .then(Paginate(page))
}

const getUserItems = (reqUserId, uris) => {
  if (reqUserId == null) return []

  return items_.byOwnersAndEntitiesAndListings([ reqUserId ], uris, 'user', reqUserId)
}

const getNetworkItems = (reqUserId, uris) => {
  if (reqUserId == null) return []

  return relations_.getUserFriendsAndCoGroupsMembers(reqUserId)
  .then(networkUsersIds => items_.byOwnersAndEntitiesAndListings(networkUsersIds, uris, 'network', reqUserId))
}

const deduplicateItems = (userItems, networkItems, publicItems) => {
  const userAndNetworkItemsIds = userItems.map(getId).concat(networkItems.map(getId))

  return publicItems
  .filter(item => !userAndNetworkItemsIds.includes(item._id))
}

const getId = _.property('_id')

module.exports = { sanitization, controller }
