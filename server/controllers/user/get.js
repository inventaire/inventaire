CONFIG = require 'config'
__ = CONFIG.universalPath
error_ = __.require 'lib', 'error/error'
{ ownerSafeData } = require './lib/authorized_user_data_pickers'

module.exports = (req, res)->
  unless req.user? then return error_.unauthorizedApiAccess req, res
  res.json ownerSafeData(req.user)
