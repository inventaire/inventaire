const __ = require('config').universalPath
const { ownerSafeData } = require('./lib/authorized_user_data_pickers')
const { getUserAccessLevels } = __.require('lib', 'get_user_access_levels')

module.exports = (req, res) => {
  // The logged in user as its document set on req.user by passport.js
  const userPrivateData = ownerSafeData(req.user)
  userPrivateData.accessLevels = getUserAccessLevels(req.user)
  res.json(userPrivateData)
}
