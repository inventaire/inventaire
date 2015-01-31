CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
userRelativeRequest = require './user-relative_request'
db = __.require('couch', 'base')('users', 'relations')

Relation = __.require('models', 'relation')

get = (userId, otherId)->
  docId = couch_.joinOrderedIds(userId, otherId)
  db.get docId

putStatus = (userId, otherId, status)->
  docId = couch_.joinOrderedIds(userId, otherId)
  # cot-node handles get-put-with-rev and inexistant doc errors
  db.update docId, updateStatus.bind(null, status)

updateStatus = (status, doc)->
  if doc? then doc.status = status
  else doc = Relation(docId, status)
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