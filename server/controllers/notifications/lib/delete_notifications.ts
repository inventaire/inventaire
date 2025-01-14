import { deleteAllNotificationsBySubjectId } from '#controllers/notifications/lib/notifications'
import { assertStrings } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'

export default (label, subjectId) => {
  assertStrings([ label, subjectId ])
  log(`deleting ${label} notifications`)
  return deleteAllNotificationsBySubjectId(subjectId)
}
