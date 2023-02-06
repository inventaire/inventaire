import { getUserRelations } from '#controllers/relations/lib/lists'
import dbFactory from '#db/couchdb/base'
import { ignoreNotFound } from '#lib/couch'
import Relation from '#models/relation'
import userRelativeRequest from './user-relative_request.js'

const db = dbFactory('users', 'relations')

const getUsersRelation = (userId, otherId) => db.get(Relation.docId(userId, otherId))

const putStatus = (userId, otherId, status) => {
  const docId = Relation.docId(userId, otherId)
  return db.update(docId, updateStatus.bind(null, docId, status), { createIfMissing: true })
}

const updateStatus = (docId, status, doc) => {
  // if doc doesnt exist, blue-cot with createIfMissing=true creates one: { _id: doc._id }
  // thus the need to test doc.status instead
  if (doc && doc.status) {
    doc.status = status
  } else {
    doc = Relation.create(docId, status)
  }
  doc.updated = Date.now()
  return doc
}

export const getRelationStatus = (userId, otherId) => {
  return getUsersRelation(userId, otherId)
  .catch(ignoreNotFound)
  .then(doc => {
    if (doc && doc.status) {
      return userRelativeRequest(userId, otherId, doc.status)
    } else {
      return 'none'
    }
  })
}

export const putFriendStatus = (userId, otherId) => {
  return putStatus(userId, otherId, 'friends')
}

export const putRequestedStatus = (userId, otherId) => {
  const status = userId < otherId ? 'a-requested' : 'b-requested'
  return putStatus(userId, otherId, status)
}

export const putNoneStatus = (userId, otherId) => {
  return putStatus(userId, otherId, 'none')
}

export const getPendingFriendsRequestsCount = userId => {
  return getUserRelations(userId)
  .then(relations => relations.otherRequested.length)
}
