import _ from '#builders/utils'
import { responses_ } from '#lib/responses'
import { updateNotificationReadStatus } from './lib/notifications.js'

export default (req, res) => {
  const reqUserId = req.user._id

  const { times } = req.body
  if (!_.isArray(times) || (times.length <= 0)) return _.ok(res)

  // TODO: consider using doc ids rather than timestamps
  return updateNotificationReadStatus(reqUserId, times)
  .then(responses_.Ok(res))
}
