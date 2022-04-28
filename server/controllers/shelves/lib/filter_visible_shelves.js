const { isVisibilityGroupKey } = require('lib/boolean_validations')

module.exports = reqUserId => ([ shelves, { networkUsersIds, groupsIds } ]) => {
  return shelves.filter(isVisibleBy(networkUsersIds, groupsIds, reqUserId))
}

const isVisibleBy = (networkUsersIds, groupsIds, reqUserId) => shelf => {
  const { owner, visibility } = shelf
  if (owner === reqUserId) return true
  if (visibility.includes('public')) return true
  if (visibility.includes('network') && networkUsersIds.includes(owner)) return true
  for (const key of visibility) {
    if (isVisibilityGroupKey(key)) {
      const groupId = key.split(':')[1]
      if (groupsIds.includes(groupId)) return true
    }
  }
  return false
}
