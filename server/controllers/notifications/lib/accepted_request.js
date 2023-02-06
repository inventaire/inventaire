import { createNotification } from '#controllers/notifications/lib/notifications'
import { assert_ } from '#lib/utils/assert_types'

export default (userToNotify, newFriend) => {
  assert_.strings([ userToNotify, newFriend ])
  return createNotification(userToNotify, 'friendAcceptedRequest', {
    user: newFriend,
  })
}
