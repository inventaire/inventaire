import _ from 'builders/utils'
import assert_ from 'lib/utils/assert_types'
import notifications_ from './notifications'

export default (label, subjectId) => {
  assert_.strings([ label, subjectId ])
  _.log(`deleting ${label} notifications`)
  return notifications_.deleteAllBySubjectId(subjectId)
}
