import { chain } from 'lodash-es'
import { getGroupById } from '#controllers/groups/lib/groups'
import { assertArray } from '#lib/utils/assert_types'
import { groupCategories } from '#models/group'
import type { Group, GroupId, GroupMembershipCategory } from '#types/group'
import type { UserId } from '#types/user'

export function userIsInGroup (userId: UserId, groupId: GroupId) {
  return getGroupById(groupId)
  .then(getAllGroupMembersIds)
  .then(usersIncludeUserId(userId))
}

export function userIsInRequested (userId: UserId, groupId: GroupId) {
  return getGroupById(groupId)
  .then(getGroupRequestedUsersIds)
  .then(usersIncludeUserId(userId))
}

export function userIsInGroupOrRequested (userId: UserId, groupId: GroupId) {
  return getGroupById(groupId)
  .then(getGroupMembersAndRequestedUsersIds)
  .then(usersIncludeUserId(userId))
}

export function userIsInAdmins (userId: UserId, groupId: GroupId) {
  return getGroupById(groupId)
  .then(getGroupAdminsIds)
  .then(usersIncludeUserId(userId))
}

export function getAllGroupsMembersIds (groups: Group[]) {
  return chain(groups)
  .map(getAllGroupMembersIds)
  .flatten()
  .value()
}

export function getGroupAdminsIds (group: Group) {
  return getUsersIdsByAgregatedCategories(group, [ 'admins' ])
}

export function getAllGroupMembersIds (group: Group) {
  return getUsersIdsByAgregatedCategories(group, groupCategories.members)
}

export function getGroupMembersAndRequestedUsersIds (group: Group) {
  return getUsersIdsByAgregatedCategories(group, [ ...groupCategories.members, 'requested' ])
}

export function getGroupRequestedUsersIds (group: Group) {
  return getUsersIdsByAgregatedCategories(group, [ 'requested' ])
}

function getUsersIdsByAgregatedCategories (group: Group, categories: readonly GroupMembershipCategory[]) {
  assertArray(categories)
  return chain(group)
  .pick(categories)
  .values()
  .flatten()
  .map('user')
  .value()
}

const usersIncludeUserId = (userId: UserId) => (users: UserId[]) => users.includes(userId)
