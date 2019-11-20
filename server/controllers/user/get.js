
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const { ownerSafeData } = require('./lib/authorized_user_data_pickers')

module.exports = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  return res.json(ownerSafeData(req.user))
}
