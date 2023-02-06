import { createNotification } from '#controllers/notifications/lib/notifications'
import { assert_ } from '#lib/utils/assert_types'

export default (groupId, actorAdminId, newAdminId) => {
  assert_.strings([ groupId, actorAdminId, newAdminId ])
  return createNotification(newAdminId, 'userMadeAdmin', {
    group: groupId,
    user: actorAdminId,
  })
}
