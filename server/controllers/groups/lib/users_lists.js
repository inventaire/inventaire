import _ from 'lodash-es'
import { assert_ } from '#lib/utils/assert_types'
import Group from '#models/group'

let getGroupById
const importCircularDependencies = async () => {
  ({ getGroupById } = await import('./groups.js'))
}
setImmediate(importCircularDependencies)

export const userIsInGroup = (userId, groupId) => {
  return getGroupById(groupId)
  .then(getAllGroupMembersIds)
  .then(usersIncludeUserId(userId))
}

export const userIsInRequested = (userId, groupId) => {
  return getGroupById(groupId)
  .then(getGroupRequestedUsersIds)
  .then(usersIncludeUserId(userId))
}

export const userIsInGroupOrRequested = (userId, groupId) => {
  return getGroupById(groupId)
  .then(getGroupMembersAndRequestedUsersIds)
  .then(usersIncludeUserId(userId))
}

export const userIsInAdmins = (userId, groupId) => {
  return getGroupById(groupId)
  .then(getGroupAdminsIds)
  .then(usersIncludeUserId(userId))
}

export const getAllGroupsMembersIds = groups => {
  return _(groups)
  .map(getAllGroupMembersIds)
  .flatten()
  .value()
}

export const getGroupAdminsIds = group => {
  return getUsersIdsByAgregatedCategories(group, [ 'admins' ])
}

export const getAllGroupMembersIds = group => {
  return getUsersIdsByAgregatedCategories(group, Group.categories.members)
}

export const getGroupMembersAndRequestedUsersIds = group => {
  return getUsersIdsByAgregatedCategories(group, Group.categories.members.concat([ 'requested' ]))
}

export const getGroupRequestedUsersIds = group => {
  return getUsersIdsByAgregatedCategories(group, [ 'requested' ])
}

const getUsersIdsByAgregatedCategories = (group, categories) => {
  assert_.array(categories)
  return _(group)
  .pick(categories)
  .values()
  .flatten()
  .map('user')
  .value()
}

const usersIncludeUserId = userId => users => users.includes(userId)
