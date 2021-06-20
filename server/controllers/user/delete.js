const _ = require('builders/utils')
const responses_ = require('lib/responses')
const { Track } = require('lib/track')
const deleteUserAndCleanup = require('controllers/user/lib/delete_user_and_cleanup')

module.exports = (req, res) => {
  const reqUserId = req.user._id

  _.warn(req.user, 'deleting user')

  return deleteUserAndCleanup(reqUserId)
  // triggering track before logging out
  // to get access to req.user before it's cleared
  .then(Track(req, [ 'user', 'delete' ]))
  .then(req.logout.bind(req))
  .then(responses_.Ok(res))
}
