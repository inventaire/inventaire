import { uniq } from 'lodash-es'
import { getUserGroupsCoMembers } from '#controllers/groups/lib/groups'
import { dbFactory } from '#db/couchdb/base'
import { mapDoc, mapValue, maxKey, minKey } from '#lib/couch'
import type { Relation } from '#types/relation'
import type { UserId } from '#types/user'
import parseRelations from './parse_relations.js'

const db = await dbFactory('relations')

function getAllUserRelations (userId: UserId, includeDocs = false) {
  return db.view<Relation>('relations', 'byStatus', {
    startkey: [ userId, minKey ],
    endkey: [ userId, maxKey ],
    include_docs: includeDocs,
  })
}

export function getUserRelations (userId: UserId) {
  return getAllUserRelations(userId)
  .then(parseRelations)
}

export async function getUserFriends (userId: UserId) {
  const query = { key: [ userId, 'friends' ] }
  const res = await db.view<Relation>('relations', 'byStatus', query)
  return mapValue(res)
}

export function deleteUserRelations (userId: UserId) {
  return getAllUserRelations(userId, true)
  .then(mapDoc)
  .then(db.bulkDelete)
}

export async function getUserFriendsAndGroupsCoMembers (userId: UserId) {
  const [ friends, coMembers ] = await Promise.all([
    getUserFriends(userId),
    getUserGroupsCoMembers(userId),
  ])
  return uniq(friends.concat(coMembers)) as UserId[]
}
