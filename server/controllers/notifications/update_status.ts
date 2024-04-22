import { isArray } from '#lib/boolean_validations'
import { responses_ } from '#lib/responses'
import { updateNotificationReadStatus } from './lib/notifications.js'

export default (req, res) => {
  const reqUserId = req.user._id

  const { times } = req.body
  if (!isArray(times) || (times.length <= 0)) return responses_.ok(res)

  // TODO: consider using doc ids rather than timestamps
  return updateNotificationReadStatus(reqUserId, times)
  .then(responses_.Ok(res))
}
