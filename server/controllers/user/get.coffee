CONFIG = require 'config'
__ = CONFIG.universalPath
error_ = __.require 'lib', 'error/error'
{ ownerSafeData } = require './lib/authorized_user_data_pickers'

if CONFIG.apiOpenBar
  get = (req, res) ->
    error_.bundle req, res, 'API is in open-bar mode', 500
else
  get = (req, res) -> res.json ownerSafeData(req.user)

module.exports = get
