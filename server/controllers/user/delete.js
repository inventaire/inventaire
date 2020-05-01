const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { Track } = __.require('lib', 'track')
const deleteUserAndCleanup = __.require('controllers', 'user/lib/delete_user_and_cleanup')

module.exports = (req, res) => {
  const reqUserId = req.user._id

  _.warn(req.user, 'deleting user')

  deleteUserAndCleanup(reqUserId)
  // triggering track before logging out
  // to get access to req.user before it's cleared
  .then(Track(req, [ 'user', 'delete' ]))
  .then(req.logout.bind(req))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}
