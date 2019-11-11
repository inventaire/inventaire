/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const couch_ = __.require('lib', 'couch');
const userRelativeRequest = require('./user-relative_request');
const db = __.require('couch', 'base')('users', 'relations');

const Relation = __.require('models', 'relation');

const get = (userId, otherId) => db.get(Relation.docId(userId, otherId));

const putStatus = function(userId, otherId, status){
  const docId = Relation.docId(userId, otherId);
  // blue-cot handles get-put-with-rev and inexistant doc errors
  return db.update(docId, updateStatus.bind(null, docId, status));
};

var updateStatus = function(docId, status, doc){
  // if doc doesnt exist, cot creates one: { _id: doc._id }
  // thus the need to test doc.status instead
  if ((doc != null ? doc.status : undefined) != null) { doc.status = status;
  } else { doc = Relation.create(docId, status); }
  doc.updated = Date.now();
  return doc;
};

const queries = {
  get,
  putStatus,
  getStatus(userId, otherId){
    return get(userId, otherId)
    .catch(couch_.ignoreNotFound)
    .then(function(doc){
      if ((doc != null ? doc.status : undefined) != null) {
        return userRelativeRequest(userId, otherId, doc.status);
      } else { return 'none'; }
    });
  },

  putFriendStatus(userId, otherId){
    return putStatus(userId, otherId, 'friends');
  },

  putRequestedStatus(userId, otherId){
    let status;
    if (userId < otherId) { status = 'a-requested';
    } else { status = 'b-requested'; }
    return putStatus(userId, otherId, status);
  },

  putNoneStatus(userId, otherId){
    return putStatus(userId, otherId, 'none');
  }
};

const lists = require('./lists')(db);

const counts = {
  pendingFriendsRequestsCount(userId){
    return lists.getUserRelations(userId)
    .then(relations => relations.otherRequested.length);
  }
};

module.exports = _.extend({}, queries, lists, counts);
