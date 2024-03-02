import { uniq } from 'lodash-es'
import { getUserGroupsCoMembers } from '#controllers/groups/lib/groups'
import dbFactory from '#db/couchdb/base'
import { mapDoc, mapValue, maxKey, minKey } from '#lib/couch'
import type { UserId } from '#types/user'
import parseRelations from './parse_relations.js'

const db = await dbFactory('users', 'relations')

const getAllUserRelations = (userId, includeDocs = false) => {
  return db.view('relations', 'byStatus', {
    startkey: [ userId, minKey ],
    endkey: [ userId, maxKey ],
    include_docs: includeDocs,
  })
}

export function getUserRelations (userId) {
  return getAllUserRelations(userId)
  .then(parseRelations)
}

export function getUserFriends (userId) {
  const query = { key: [ userId, 'friends' ] }
  return db.view('relations', 'byStatus', query)
  .then(mapValue)
}

export function deleteUserRelations (userId) {
  return getAllUserRelations(userId, true)
  .then(mapDoc)
  .then(db.bulkDelete)
}

export async function getUserFriendsAndGroupsCoMembers (userId) {
  const [ friends, coMembers ] = await Promise.all([
    getUserFriends(userId),
    getUserGroupsCoMembers(userId),
  ])
  return uniq(friends.concat(coMembers)) as UserId[]
}
