import _ from 'builders/utils'
import responses_ from 'lib/responses'
import { updateReadStatus } from './lib/notifications'

export default (req, res) => {
  const reqUserId = req.user._id

  const { times } = req.body
  if (!_.isArray(times) || (times.length <= 0)) return _.ok(res)

  // TODO: consider using doc ids rather than timestamps
  return updateReadStatus(reqUserId, times)
  .then(responses_.Ok(res))
}
