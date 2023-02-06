import { getUserGroupsIds } from '#controllers/groups/lib/groups'
import { isVisibilityGroupKey } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'

// This does async validations that can not be performed sync
// by models/validations/visibility.js
export async function validateVisibilityKeys (visibilityKeys, ownerId) {
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
    throw error_.new('user is not in that group', 400, { visibilityKeys, groupId })
  }
}

export const getVisibilitySummaryKey = visibilityKeys => {
  if (visibilityKeys.length === 0) return 'private'
  if (visibilityKeys.includes('public')) return 'public'
  return 'network'
}

export const getGroupVisibilityKey = groupId => `group:${groupId}`
