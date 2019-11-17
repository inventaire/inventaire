// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')

// Working around the circular dependency
let groups_
let user_
const lateRequire = () => {
  groups_ = require('./groups')
  return user_ = __.require('controllers', 'user/lib/user')
}
setTimeout(lateRequire, 0)

module.exports = (fnName, fnArgs, reqUserId) => {
  assert_.array(fnArgs)
  return groups_[fnName].apply(null, fnArgs)
  .then(group => {
    if (group == null) throw error_.notFound(groupId)

    const usersIds = groups_.allGroupMembers(group)

    return user_.getUsersByIds(usersIds, reqUserId)
    .then(users => ({
      group,
      users
    }))
  })
}
