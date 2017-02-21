CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Group = __.require 'models', 'group'
radio = __.require 'lib', 'radio'
initMembershipUpdateHooks = require './membership_update_hooks'

module.exports = (db)->
  membershipUpdate = (action, data, userId)->
    { group:groupId, user:secondaryUserId } = data
    db.update groupId, Group[action].bind(null, userId, secondaryUserId)
    .then -> radio.emit "group:#{action}", groupId, userId, secondaryUserId

  initMembershipUpdateHooks db

  return MembershipUpdate = (action)->
    membershipUpdate.bind(null, action)
