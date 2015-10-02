CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Group = __.require 'models', 'group'
Radio = __.require 'lib', 'radio'

module.exports = (db)->
  membershipUpdate = (action, data, userId)->
    groupId = data.group
    secondaryUserId = data.user
    db.update groupId, Group[action].bind(null, userId, secondaryUserId)
    .then -> Radio.emit "group:#{action}", groupId, userId, secondaryUserId

  return MembershipUpdate = (action)->
    membershipUpdate.bind(null, action)
