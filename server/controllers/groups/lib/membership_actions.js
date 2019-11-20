const CONFIG = require('config')
const __ = CONFIG.universalPath
const { membershipActionsList } = __.require('models', 'group')
const Group = __.require('models', 'group')
const radio = __.require('lib', 'radio')
const initMembershipUpdateHooks = require('./membership_update_hooks')

module.exports = db => {
  const actions = {}
  membershipActionsList.forEach(action => {
    actions[action] = membershipUpdate(db, action)
  })

  initMembershipUpdateHooks(db)

  return actions
}

const membershipUpdate = (db, action) => (data, userId) => {
  const { group: groupId, user: secondaryUserId } = data
  return db.update(groupId, Group[action].bind(null, userId, secondaryUserId))
  .then(() => radio.emit(`group:${action}`, groupId, userId, secondaryUserId))
}
