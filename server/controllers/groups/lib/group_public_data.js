
const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')

// Working around the circular dependency
let groups_
let user_
const lateRequire = () => {
  groups_ = require('./groups')
  user_ = __.require('controllers', 'user/lib/user')
}
setTimeout(lateRequire, 0)

// fnName: byId or bySlug
// fnArgs: [ id ] or [ slug ]
module.exports = (fnName, fnArgs, reqUserId) => {
  assert_.array(fnArgs)
  return groups_[fnName].apply(null, fnArgs)
  .then(group => {
    if (group == null) throw error_.notFound(fnArgs[0])

    const usersIds = groups_.allGroupMembers(group)

    return user_.getUsersByIds(usersIds, reqUserId)
    .then(users => ({ group, users }))
  })
}
