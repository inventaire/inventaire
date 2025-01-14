import { createNotification } from '#controllers/notifications/lib/notifications'
import { assertStrings } from '#lib/utils/assert_types'

export default (userToNotify, newFriend) => {
  assertStrings([ userToNotify, newFriend ])
  return createNotification(userToNotify, 'friendAcceptedRequest', {
    user: newFriend,
  })
}
