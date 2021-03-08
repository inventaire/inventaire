const __ = require('config').universalPath
const assert_ = __.require('lib', 'utils/assert_types')
const notifications_ = require('./notifications')

module.exports = (userToNotify, newFriend) => {
  assert_.strings([ userToNotify, newFriend ])
  return notifications_.add(userToNotify, 'friendAcceptedRequest', {
    user: newFriend
  })
}
