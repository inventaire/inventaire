module.exports = reqUserId => ([ shelves, userFriendsIds ]) => {
  return shelves.filter(isVisibleBy(userFriendsIds, reqUserId))
}

const isVisibleBy = (userFriendsIds, reqUserId) => shelf => {
  if (shelf.owner === reqUserId) { return true }
  if (shelf.listing === 'public') { return true }
  if (shelf.listing === 'network' && userFriendsIds.includes(shelf.owner)) { return true }
}
