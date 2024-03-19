import { deleteAllNotificationsBySubjectId } from '#controllers/notifications/lib/notifications'
import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'

export default (label, subjectId) => {
  assert_.strings([ label, subjectId ])
  log(`deleting ${label} notifications`)
  return deleteAllNotificationsBySubjectId(subjectId)
}
