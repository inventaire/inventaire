const __ = require('config').universalPath
const assert_ = require('lib/utils/assert_types')
const notifications_ = require('./notifications')

module.exports = (groupId, actorAdminId, newAdminId) => {
  assert_.strings([ groupId, actorAdminId, newAdminId ])
  return notifications_.add(newAdminId, 'userMadeAdmin', {
    group: groupId,
    user: actorAdminId
  })
}
