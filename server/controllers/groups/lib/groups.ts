import { map, uniq, without } from 'lodash-es'
import { getAllGroupsMembersIds } from '#controllers/groups/lib/users_lists'
import dbFactory from '#db/couchdb/base'
import { notFoundError } from '#lib/error/error'
import searchGroupsByPositionFactory from '#lib/search_by_position'
import { assert_ } from '#lib/utils/assert_types'
import { Log } from '#lib/utils/logs'
import { groupRoles } from '#models/attributes/group'
import { createGroupDoc, findGroupInvitation, getAllGroupDocMembersIds } from '#models/group'
import type { GroupId, Group } from '#types/group'
import { addSlug } from './slug.js'

const db = await dbFactory('groups')
const searchGroupsByPosition = searchGroupsByPositionFactory(db, 'groups')

export const getGroupById = (id: GroupId) => db.findDocByViewKey<Group>('byId', id)
export const getGroupsByIds = (ids: GroupId[]) => db.byIds<Group>(ids)
export const getGroupBySlug = (id: GroupId) => db.findDocByViewKey<Group>('bySlug', id)

export async function getGroupsWhereUserIsAdmin (userId) {
  return db.getDocsByViewKeys<Group>('byRoleAndUser', [
    [ 'admins', userId ],
  ])
}

export async function getGroupsWhereUserIsAdminOrMember (userId) {
  return db.getDocsByViewKeys<Group>('byRoleAndUser', [
    [ 'admins', userId ],
    [ 'members', userId ],
  ])
}

export async function getGroupsWhereUserIsInvited (userId) {
  return db.getDocsByViewKeys<Group>('byRoleAndUser', [
    [ 'invited', userId ],
  ])
}

export async function getGroupsWhereUserIsAdminOrMemberOrInvited (userId) {
  return db.getDocsByViewKeys<Group>('byRoleAndUser', [
    [ 'admins', userId ],
    [ 'members', userId ],
    [ 'invited', userId ],
  ])
}

export async function getGroupsWhereUserHasAnyRole (userId) {
  return db.getDocsByViewKeys<Group>('byRoleAndUser', groupRoles.map(role => [ role, userId ]))
}

export async function getGroupsIdsWhereUserIsAdminOrMember (userId) {
  assert_.string(userId)
  const { rows } = await db.view<null, Group>('groups', 'byRoleAndUser', {
    include_docs: false,
    keys: [
      [ 'admins', userId ],
      [ 'members', userId ],
    ],
  })
  return map(rows, 'id')
}

export async function getGroupsIdsWhereUsersAreAdminsOrMembers (usersIds) {
  assert_.strings(usersIds)
  const { rows } = await db.view<null, Group>('groups', 'byRoleAndUser', {
    include_docs: false,
    keys: usersIds.flatMap(userId => {
      return [
        [ 'admins', userId ],
        [ 'members', userId ],
      ]
    }),
  })
  const groupsIdsByMembersIds: Record<typeof usersIds[number], GroupId[]> = {}
  usersIds.forEach(userId => { groupsIdsByMembersIds[userId] = [] })
  rows.forEach(({ id: groupId, key }) => {
    const userId = key[1]
    groupsIdsByMembersIds[userId].push(groupId)
  })
  return groupsIdsByMembersIds
}

export async function createGroup (options) {
  const group = createGroupDoc(options)
  await addSlug(group)
  return db.postAndReturn(group).then(Log('group created'))
}

export async function getUserGroupsCoMembers (userId) {
  const groups = await getGroupsWhereUserIsAdminOrMember(userId)
  return getCoMembersIds(groups, userId)
}

export async function getInvitedUser (userId, groupId) {
  const group = await getGroupById(groupId)
  return findGroupInvitation(userId, group, true)
}

export async function getGroupMembersIds (groupId) {
  const group = await getGroupById(groupId)
  if (group == null) throw notFoundError({ group: groupId })
  return getAllGroupDocMembersIds(group)
}

export const getGroupsByPosition = searchGroupsByPosition

export async function imageIsUsed (imageHash) {
  assert_.string(imageHash)
  const { rows } = await db.view<null, Group>('groups', 'byPicture', { key: imageHash })
  return rows.length > 0
}

const getCoMembersIds = (groups, userId) => {
  const usersIds = getAllGroupsMembersIds(groups)
  // Deduplicate and remove the user own id from the list
  return uniq(without(usersIds, userId))
}
