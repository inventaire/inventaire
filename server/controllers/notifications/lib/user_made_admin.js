import assert_ from 'lib/utils/assert_types'
import notifications_ from './notifications'

export default (groupId, actorAdminId, newAdminId) => {
  assert_.strings([ groupId, actorAdminId, newAdminId ])
  return notifications_.add(newAdminId, 'userMadeAdmin', {
    group: groupId,
    user: actorAdminId
  })
}
