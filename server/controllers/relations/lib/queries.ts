import { getUserRelations } from '#controllers/relations/lib/lists'
import { dbFactory } from '#db/couchdb/base'
import { ignoreNotFound } from '#lib/couch'
import { createRelationDoc, getRelationDocId } from '#models/relation'
import type { NewCouchDoc } from '#types/couchdb'
import type { Relation, RelationId, RelationStatus } from '#types/relation'
import type { UserId } from '#types/user'
import userRelativeRequest from './user-relative_request.js'

const db = await dbFactory('users', 'relations')

function getUsersRelation (userId: UserId, otherId: UserId) {
  const relationId = getRelationDocId(userId, otherId)
  return db.get<Relation>(relationId)
}

function putStatus (userId: UserId, otherId: UserId, status: RelationStatus) {
  const docId = getRelationDocId(userId, otherId)
  return db.update(docId, updateStatus.bind(null, docId, status), { createIfMissing: true })
}

function updateStatus (docId: RelationId, status: RelationStatus, doc: Relation | NewCouchDoc<Relation>) {
  // if doc doesnt exist, blue-cot with createIfMissing=true creates one: { _id: doc._id }
  // thus the need to test doc.status instead
  if (doc && doc.status) {
    doc.status = status
  } else {
    doc = createRelationDoc(docId, status)
  }
  doc.updated = Date.now()
  return doc
}

export async function getRelationStatus (userId: UserId, otherId: UserId) {
  const doc = await getUsersRelation(userId, otherId).catch(ignoreNotFound)
  if (doc && doc.status) {
    return userRelativeRequest(userId, otherId, doc.status)
  } else {
    return 'none'
  }
}

export function putFriendStatus (userId: UserId, otherId: UserId) {
  return putStatus(userId, otherId, 'friends')
}

export function putRequestedStatus (userId: UserId, otherId: UserId) {
  const status = userId < otherId ? 'a-requested' : 'b-requested'
  return putStatus(userId, otherId, status)
}

export function putNoneStatus (userId: UserId, otherId: UserId) {
  return putStatus(userId, otherId, 'none')
}

export async function getPendingFriendsRequestsCount (userId: UserId) {
  const relations = await getUserRelations(userId)
  return relations.otherRequested.length
}
