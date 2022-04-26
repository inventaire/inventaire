module.exports = reqUserId => ([ shelves, userFriendsIds ]) => {
  return shelves.filter(isVisibleBy(userFriendsIds, reqUserId))
}

const isVisibleBy = (userFriendsIds, reqUserId) => shelf => {
  const { owner, visibility } = shelf
  if (owner === reqUserId) return true
  if (visibility.includes('public')) return true
  if (visibility.includes('network') && userFriendsIds.includes(owner)) return true
}
