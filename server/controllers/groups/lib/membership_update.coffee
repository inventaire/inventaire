CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Group = __.require 'models', 'group'
Radio = __.require 'lib', 'radio'

module.exports = (db)->
  membershipUpdate = (action, data, userId)->
    { group:groupId, user:secondaryUserId } = data
    db.update groupId, Group[action].bind(null, userId, secondaryUserId)
    .then -> Radio.emit "group:#{action}", groupId, userId, secondaryUserId

  return MembershipUpdate = (action)->
    membershipUpdate.bind(null, action)
