const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('lib', 'utils/assert_types')
const lists_ = require('./users_lists')
const groups_ = require('./groups')
const user_ = __.require('controllers', 'user/lib/user')

// fnName: byId or bySlug
// fnArgs: [ id ] or [ slug ]
module.exports = (fnName, fnArgs, reqUserId) => {
  assert_.array(fnArgs)
  return groups_[fnName].apply(null, fnArgs)
  .then(group => {
    if (group == null) throw error_.notFound(fnArgs[0])

    const usersIds = lists_.allGroupMembers(group)

    return user_.getUsersByIds(usersIds, reqUserId)
    .then(users => ({ group, users }))
  })
}
