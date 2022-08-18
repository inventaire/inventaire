const error_ = require('lib/error/error')
const searchUsersItems = require('./lib/search_users_items')
const { filterPrivateAttributes } = require('controllers/items/lib/filter_private_attributes')
const { getGroupMembersIds } = require('controllers/groups/lib/groups')
const { getOwnerIdAndVisibilityKeys } = require('controllers/items/lib/get_authorized_items')

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  search: {}
}

const controller = async ({ reqUserId, userId, groupId, search }) => {
  if (!(userId || groupId)) {
    throw error_.newMissingQuery('user|group')
  }
  const usersIds = await getUsersIds({ userId, groupId })
  const ownersIdsAndVisibilityKeys = await Promise.all(usersIds.map(getOwnerIdAndVisibilityKeys(reqUserId)))
  const items = await searchUsersItems({ search, reqUserId, ownersIdsAndVisibilityKeys })
  return {
    items: items.map(filterPrivateAttributes(reqUserId))
  }
}

const getUsersIds = ({ userId, groupId }) => {
  if (groupId) {
    return getGroupMembersIds(groupId)
  } else {
    return [ userId ]
  }
}

module.exports = { sanitization, controller }
