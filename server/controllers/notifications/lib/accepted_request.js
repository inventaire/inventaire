import assert_ from '#lib/utils/assert_types'
import notifications_ from './notifications.js'

export default (userToNotify, newFriend) => {
  assert_.strings([ userToNotify, newFriend ])
  return notifications_.add(userToNotify, 'friendAcceptedRequest', {
    user: newFriend
  })
}
