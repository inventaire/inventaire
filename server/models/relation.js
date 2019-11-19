// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const couch_ = __.require('lib', 'couch')
const assert = require('assert')
const assert_ = __.require('utils', 'assert_types')
const { userId } = require('./validations/common')

module.exports = {
  create: (id, status) => {
    assertValidId(id)
    assertValidStatus(status)
    return {
      _id: id,
      type: 'relation',
      status,
      created: Date.now()
    }
  },

  docId: (userId, otherId) => {
    // TODO: add a receiver-read flag to stop notifying already read requestes
    return couch_.joinOrderedIds(userId, otherId)
  }
}

const assertValidId = id => {
  const [ userA, userB ] = id.split(':')
  assert(userA !== userB)
  assert_.string(userA)
  assert(userId(userA))
  return assert(userId(userB))
}

const assertValidStatus = status => assert(statuses.includes(status))

const statuses = [
  'friends',
  'a-requested',
  'b-requested',
  'none'
]
