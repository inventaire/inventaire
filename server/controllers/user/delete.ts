import deleteUserAndCleanup from '#controllers/user/lib/delete_user_and_cleanup'
import { responses_ } from '#lib/responses'
import { track } from '#lib/track'
import { warn } from '#lib/utils/logs'

export default async function (req, res) {
  const reqUserId = req.user._id

  warn(req.user, 'deleting user')

  await deleteUserAndCleanup(reqUserId)
  // triggering track before logging out
  // to get access to req.user before it's cleared
  track(req, [ 'user', 'delete' ])
  req.logout()
  responses_.ok(res)
}
