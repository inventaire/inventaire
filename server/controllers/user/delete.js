import _ from 'builders/utils'
import responses_ from 'lib/responses'
import { Track } from 'lib/track'
import deleteUserAndCleanup from 'controllers/user/lib/delete_user_and_cleanup'

export default (req, res) => {
  const reqUserId = req.user._id

  _.warn(req.user, 'deleting user')

  return deleteUserAndCleanup(reqUserId)
  // triggering track before logging out
  // to get access to req.user before it's cleared
  .then(Track(req, [ 'user', 'delete' ]))
  .then(req.logout.bind(req))
  .then(responses_.Ok(res))
}
