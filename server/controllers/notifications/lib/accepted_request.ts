import { createNotification } from '#controllers/notifications/lib/notifications'
import type { UserId } from '#types/user'

export function acceptedRequest (userToNotify: UserId, newFriend: UserId) {
  return createNotification(userToNotify, 'friendAcceptedRequest', {
    user: newFriend,
  })
}
