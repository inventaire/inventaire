CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'

module.exports = (req, res)->
  { name } = req.body
  unless name? then return error_.bundle res, 'missing group name', 400
  creatorId = req.user._id

  groups_.create name, creatorId
  .then res.json.bind(res)
  .catch _.Error('group create')