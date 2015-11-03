CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
userRelativeRequest = require './user-relative_request'
db = __.require('couch', 'base')('users', 'relations')

Relation = __.require('models', 'relation')

get = (userId, otherId)->
  db.get Relation.docId(userId, otherId)

putStatus = (userId, otherId, status)->
  docId = Relation.docId(userId, otherId)
  # cot-node handles get-put-with-rev and inexistant doc errors
  db.update docId, updateStatus.bind(null, docId, status)

updateStatus = (docId, status, doc)->
  # if doc doesnt exist, cot creates one: {_id: doc._id}
  # thus the need to test doc.status instead
  if doc?.status? then doc.status = status
  else doc = Relation.create(docId, status)
  doc.updated = _.now()
  return doc

queries =
  get: get
  putStatus: putStatus
  getStatus: (userId, otherId)->
    get(userId, otherId)
    .catch couch_.ignoreNotFound
    .then (doc)->
      if doc?.status?
        return userRelativeRequest(userId, otherId, doc.status)
      else 'none'

  putFriendStatus: (userId, otherId)->
    putStatus userId, otherId, 'friends'

  putRequestedStatus: (userId, otherId)->
    if userId < otherId then status = 'a-requested'
    else status = 'b-requested'
    putStatus userId, otherId, status

  putNoneStatus: (userId, otherId)->
    putStatus userId, otherId, 'none'


lists = require('./lists')(db)
module.exports = _.extend {}, queries, lists