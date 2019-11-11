// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { membershipActionsList } = __.require('models', 'group')
const Group = __.require('models', 'group')
const radio = __.require('lib', 'radio')
const initMembershipUpdateHooks = require('./membership_update_hooks')

module.exports = function(db){
  const actions = {}
  membershipActionsList.forEach(action => actions[action] = membershipUpdate(db, action))

  initMembershipUpdateHooks(db)

  return actions
}

var membershipUpdate = (db, action) => (function(data, userId) {
  const { group:groupId, user:secondaryUserId } = data
  return db.update(groupId, Group[action].bind(null, userId, secondaryUserId))
  .then(() => radio.emit(`group:${action}`, groupId, userId, secondaryUserId))
})
