const { isVisibilityGroupKey } = require('lib/boolean_validations')
const { getUserGroupsIds } = require('controllers/groups/lib/groups')
const error_ = require('lib/error/error')

const validateVisibilityKeys = async (visibilityKeys, ownerId) => {
  if (hasGroupKeys(visibilityKeys)) {
    const userGroupsIds = await getUserGroupsIds(ownerId)
    validateGroupKeys(visibilityKeys, userGroupsIds)
  }
}

const hasGroupKeys = visibility => visibility.some(isVisibilityGroupKey)

const validateGroupKeys = (visibilityKeys, userGroupsIds) => {
  visibilityKeys
  .filter(isVisibilityGroupKey)
  .forEach(validateGroupKey(userGroupsIds, visibilityKeys))
}

const validateGroupKey = (userGroupsIds, visibilityKeys) => key => {
  const groupId = key.split(':')[1]
  if (!userGroupsIds.includes(groupId)) {
    throw error_.new('owner is not in that group', 400, { visibilityKeys, groupId })
  }
}

const getVisibilitySummaryKey = visibilityKeys => {
  if (visibilityKeys.length === 0) return 'private'
  if (visibilityKeys.includes('public')) return 'public'
  return 'network'
}

const getGroupVisibilityKey = groupId => `group:${groupId}`

module.exports = {
  validateVisibilityKeys,
  getVisibilitySummaryKey,
  getGroupVisibilityKey,
}
