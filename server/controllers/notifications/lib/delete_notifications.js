const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('lib', 'utils/assert_types')
const notifications_ = require('./notifications')

module.exports = (label, subjectId) => {
  assert_.strings([ label, subjectId ])
  _.log(`deleting ${label} notifications`)
  return notifications_.deleteAllBySubjectId(subjectId)
}
