import { map, union, uniq, without } from 'lodash-es'
import { getAllGroupsMembersIds } from '#controllers/groups/lib/users_lists'
import dbFactory from '#db/couchdb/base'
import { error_ } from '#lib/error/error'
import searchGroupsByPositionFactory from '#lib/search_by_position'
import { assert_ } from '#lib/utils/assert_types'
import { Log } from '#lib/utils/logs'
import Group from '#models/group'
import { addSlug } from './slug.js'

const db = await dbFactory('groups')
const searchGroupsByPosition = searchGroupsByPositionFactory(db, 'groups')

// using a view to avoid returning users or relations
export const getGroupById = db.viewFindOneByKey.bind(db, 'byId')
export const getGroupsByIds = db.byIds
export const getGroupBySlug = db.viewFindOneByKey.bind(db, 'bySlug')
export const getGroupsByUser = db.viewByKey.bind(db, 'byUser')
export const getGroupsByInvitedUser = db.viewByKey.bind(db, 'byInvitedUser')

export async function getGroupsByAdmin (userId) {
  // could be simplified by making the byUser view
  // emit an arrey key with the role as second parameter
  // but it would make getGroupsByUser more complex
  // (i.e. use a range instead of a simple key)
  const groups = await db.viewByKey('byUser', userId)
  return groups.filter(group => Group.userIsAdmin(userId, group))
}

// including invitations
export async function allUserGroups (userId) {
  const groups = await Promise.all([
    getGroupsByUser(userId),
    getGroupsByInvitedUser(userId),
  ])
  return union(...groups)
}

export async function getUserGroupsIds (userId) {
  assert_.string(userId)
  const { rows } = await db.view('groups', 'byUser', {
    include_docs: false,
    key: userId,
  })
  return map(rows, 'id')
}

export async function getUsersGroupsIds (usersIds) {
  assert_.strings(usersIds)
  const { rows } = await db.view('groups', 'byUser', {
    include_docs: false,
    keys: usersIds,
  })
  const groupsIdsByMembersIds = {}
  usersIds.forEach(userId => { groupsIdsByMembersIds[userId] = [] })
  rows.forEach(({ id: groupId, key: userId }) => groupsIdsByMembersIds[userId].push(groupId))
  return groupsIdsByMembersIds
}

export async function createGroup (options) {
  const group = Group.create(options)
  await addSlug(group)
  return db.postAndReturn(group).then(Log('group created'))
}

export async function getUserGroupsCoMembers (userId) {
  const groups = await getGroupsByUser(userId)
  return getCoMembersIds(groups, userId)
}

export async function getInvitedUser (userId, groupId) {
  const group = await getGroupById(groupId)
  return Group.findInvitation(userId, group, true)
}

export async function getGroupMembersIds (groupId) {
  const group = await getGroupById(groupId)
  if (group == null) throw error_.notFound({ group: groupId })
  return Group.getAllMembersIds(group)
}

export const getGroupsByPosition = searchGroupsByPosition

export async function imageIsUsed (imageHash) {
  assert_.string(imageHash)
  const { rows } = await db.view('groups', 'byPicture', { key: imageHash })
  return rows.length > 0
}

const getCoMembersIds = (groups, userId) => {
  const usersIds = getAllGroupsMembersIds(groups)
  // Deduplicate and remove the user own id from the list
  return uniq(without(usersIds, userId))
}
