const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const notifications_ = require('./notifications')

module.exports = (label, subjectId) => {
  assert_.strings([ label, subjectId ])
  _.log(`deleting ${label} notifications`)
  return notifications_.deleteAllBySubjectId(subjectId)
}
