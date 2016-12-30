ownerSafeData = require './lib/owner_safe_data'
module.exports = (req, res) -> res.json ownerSafeData(req.user)
