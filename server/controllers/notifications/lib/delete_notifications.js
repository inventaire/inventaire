import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import notifications_ from './notifications.js'

export default (label, subjectId) => {
  assert_.strings([ label, subjectId ])
  log(`deleting ${label} notifications`)
  return notifications_.deleteAllBySubjectId(subjectId)
}
