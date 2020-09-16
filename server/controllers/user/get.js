const { ownerSafeData } = require('./lib/authorized_user_data_pickers')

module.exports = (req, res) => {
  // The logged in user as its document set on req.user by passport.js
  const userPrivateData = ownerSafeData(req.user)
  res.json(userPrivateData)
}
