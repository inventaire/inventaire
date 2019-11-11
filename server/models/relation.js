/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const couch_ = __.require('lib', 'couch');
const assert = require('assert');
const assert_ = __.require('utils', 'assert_types');
const { userId } = require('./validations/common');

module.exports = {
  create(id, status){
    let relation;
    assertValidId(id);
    assertValidStatus(status);
    return _.log(relation = {
      _id: id,
      type: 'relation',
      status,
      created: Date.now()
    }
    );
  },

  docId(userId, otherId){
    // TODO: add a receiver-read flag to stop notifying already read requestes
    return couch_.joinOrderedIds(userId, otherId);
  }
};

var assertValidId = function(id){
  const [ userA, userB ] = Array.from(id.split(':'));
  assert(userA !== userB);
  assert_.string(userA);
  assert(userId(userA));
  return assert(userId(userB));
};

var assertValidStatus = status => assert(statuses.includes(status));

var statuses = [
  'friends',
  'a-requested',
  'b-requested',
  'none'
];
