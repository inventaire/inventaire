const CONFIG = require('config')
const __ = CONFIG.universalPath
const Group = __.require('models', 'group')
const radio = __.require('lib', 'radio')
const initMembershipUpdateHooks = require('./membership_update_hooks')
const db = __.require('couch', 'base')('groups')

module.exports = action => {
  const actionFn = membershipUpdate(db, action)
  initMembershipUpdateHooks(db)
  return actionFn
}

const membershipUpdate = (db, action) => (data, userId) => {
  const { group: groupId, user: secondaryUserId } = data
  return db.update(groupId, Group[action].bind(null, userId, secondaryUserId))
  .then(() => radio.emit(`group:${action}`, groupId, userId, secondaryUserId))
}
