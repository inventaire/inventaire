__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'
parseAndValidateIds = require './lib/parse_and_validate_ids'

module.exports = (req, res, ids) ->
  userId = req.user._id

  promises_.start
  .then parseAndValidateIds.bind(null, ids)
  .then user_.getRelationsStatuses.bind(null, userId)
  .then (res)->
    [friends, coGroupMembers] = res
    # not fetching non-friends non-coGroupMembers items
    return networkIds = _.uniq coGroupMembers.concat(friends)
  .then items_.friendsListings
  .then res.json.bind(res)
  .catch error_.Handler(res)
