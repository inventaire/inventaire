const _ = require('builders/utils')
const responses_ = require('lib/responses')
const { updateReadStatus } = require('./lib/notifications')

module.exports = (req, res) => {
  const reqUserId = req.user._id

  const { times } = req.body
  if (!_.isArray(times) || (times.length <= 0)) return _.ok(res)

  // TODO: consider using doc ids rather than timestamps
  return updateReadStatus(reqUserId, times)
  .then(responses_.Ok(res))
}
