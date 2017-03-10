CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res)->
  { name, searchable, description, position } = req.body
  unless name? then return error_.bundleMissingBody req, res, 'name'

  groups_.create
    name: name
    description: description or ''
    searchable: searchable
    position: position or null
    creatorId: req.user._id
  .then res.json.bind(res)
  .then Track(req, ['groups', 'create'])
  .catch error_.Handler(req, res)
