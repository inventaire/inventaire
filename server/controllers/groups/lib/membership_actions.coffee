CONFIG = require 'config'
__ = CONFIG.universalPath
{ membershipActionsList } = __.require 'models', 'group'
Group = __.require 'models', 'group'
radio = __.require 'lib', 'radio'
initMembershipUpdateHooks = require './membership_update_hooks'

module.exports = (db)->
  actions = {}
  membershipActionsList.forEach (action)->
    actions[action] = membershipUpdate db, action

  initMembershipUpdateHooks db

  return actions

membershipUpdate = (db, action)-> (data, userId)->
  { group:groupId, user:secondaryUserId } = data
  db.update groupId, Group[action].bind(null, userId, secondaryUserId)
  .then -> radio.emit "group:#{action}", groupId, userId, secondaryUserId
