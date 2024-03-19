import { chain } from 'lodash-es'
import { getGroupById } from '#controllers/groups/lib/groups'
import { assert_ } from '#lib/utils/assert_types'
import { groupCategories } from '#models/group'

export function userIsInGroup (userId, groupId) {
  return getGroupById(groupId)
  .then(getAllGroupMembersIds)
  .then(usersIncludeUserId(userId))
}

export function userIsInRequested (userId, groupId) {
  return getGroupById(groupId)
  .then(getGroupRequestedUsersIds)
  .then(usersIncludeUserId(userId))
}

export function userIsInGroupOrRequested (userId, groupId) {
  return getGroupById(groupId)
  .then(getGroupMembersAndRequestedUsersIds)
  .then(usersIncludeUserId(userId))
}

export function userIsInAdmins (userId, groupId) {
  return getGroupById(groupId)
  .then(getGroupAdminsIds)
  .then(usersIncludeUserId(userId))
}

export function getAllGroupsMembersIds (groups) {
  return chain(groups)
  .map(getAllGroupMembersIds)
  .flatten()
  .value()
}

export function getGroupAdminsIds (group) {
  return getUsersIdsByAgregatedCategories(group, [ 'admins' ])
}

export function getAllGroupMembersIds (group) {
  return getUsersIdsByAgregatedCategories(group, groupCategories.members)
}

export function getGroupMembersAndRequestedUsersIds (group) {
  return getUsersIdsByAgregatedCategories(group, groupCategories.members.concat([ 'requested' ]))
}

export function getGroupRequestedUsersIds (group) {
  return getUsersIdsByAgregatedCategories(group, [ 'requested' ])
}

const getUsersIdsByAgregatedCategories = (group, categories) => {
  assert_.array(categories)
  return chain(group)
  .pick(categories)
  .values()
  .flatten()
  .map('user')
  .value()
}

const usersIncludeUserId = userId => users => users.includes(userId)
