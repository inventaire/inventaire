CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models','tests/common-tests'
promises_ = __.require 'lib', 'promises'
groups_ = require './lib/groups'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'

module.exports = (req, res)->
  { id } = req.query

  unless tests.valid 'groupId', id
    return error_.bundle res, "invalid groupId", 400, id

  getGroupData id
  .then res.json.bind(res)
  .catch error_.Handler(res)

getGroupData = (groupId)->
  groups_.byId groupId
  .then (group)->
    getUsersAndItems(group)
    .spread (users, items)->
      group: group
      users: users
      items: items

getUsersAndItems = (group)->
  usersIds = groups_.allGroupMembers group
  promises_.all [
    user_.getUsersPublicData(usersIds)
    items_.bundleListings(['public'], usersIds)
  ]
