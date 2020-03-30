const __ = require('config').universalPath
const { getNetworkIds } = __.require('controllers', 'user/lib/relations_status')
const listingsLists = require('./listings_lists')

module.exports = reqUserId => async shelf => {
  const { _id: shelfId } = shelf
  if (!reqUserId) {
    return buildKeys(shelfId, listingsLists.public)
  }
  const reqFriendsIds = await getNetworkIds(reqUserId)
  if (reqUserId && reqFriendsIds.includes(shelf.owner)) {
    return buildKeys(shelfId, listingsLists.network)
  }
  // shelf's owner can access their private items
  if (shelf.owner === reqUserId) {
    return buildKeys(shelfId, listingsLists.user)
  }
  return buildKeys(shelfId, listingsLists.public)
}

const buildKeys = (shelfId, listingsList) => {
  return listingsList.map(listing => {
    return [ shelfId, listing ]
  })
}
