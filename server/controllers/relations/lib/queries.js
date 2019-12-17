const CONFIG = require('config')
const __ = CONFIG.universalPath
const userRelativeRequest = require('./user-relative_request')
const db = __.require('couch', 'base')('users', 'relations')

const Relation = __.require('models', 'relation')

const get = (userId, otherId) => db.get(Relation.docId(userId, otherId))

const putStatus = (userId, otherId, status) => {
  const docId = Relation.docId(userId, otherId)
  // blue-cot handles get-put-with-rev and inexistant doc errors
  return db.update(docId, updateStatus.bind(null, docId, status))
}

const updateStatus = (docId, status, doc) => {
  // if doc doesnt exist, cot creates one: { _id: doc._id }
  // thus the need to test doc.status instead
  if (doc && doc.status) {
    doc.status = status
  } else {
    doc = Relation.create(docId, status)
  }
  doc.updated = Date.now()
  return doc
}

const queries = {
  get,
  putStatus,
  getStatus: (userId, otherId) => {
    return get(userId, otherId)
    .catch(() => {})
    .then(doc => {
      if (doc && doc.status) {
        return userRelativeRequest(userId, otherId, doc.status)
      } else {
        return 'none'
      }
    })
  },

  putFriendStatus: (userId, otherId) => {
    return putStatus(userId, otherId, 'friends')
  },

  putRequestedStatus: (userId, otherId) => {
    const status = userId < otherId ? 'a-requested' : 'b-requested'
    return putStatus(userId, otherId, status)
  },

  putNoneStatus: (userId, otherId) => {
    return putStatus(userId, otherId, 'none')
  }
}

const lists = require('./lists')

const counts = {
  pendingFriendsRequestsCount: userId => {
    return lists.getUserRelations(userId)
    .then(relations => relations.otherRequested.length)
  }
}

module.exports = Object.assign({}, queries, lists, counts)
