import { createNotification } from '#controllers/notifications/lib/notifications'
import { assertStrings } from '#lib/utils/assert_types'

export default (groupId, actorAdminId, newAdminId) => {
  assertStrings([ groupId, actorAdminId, newAdminId ])
  return createNotification(newAdminId, 'userMadeAdmin', {
    group: groupId,
    user: actorAdminId,
  })
}
