const Group = require('models/group')
const radio = require('lib/radio')
const initMembershipUpdateHooks = require('./membership_update_hooks')
const db = require('db/couchdb/base')('groups')

module.exports = async (action, params) => {
  const { reqUserId, group: groupId, user: secondaryUserId } = params
  const docUpdateFn = Group[action].bind(null, reqUserId, secondaryUserId)
  await db.update(groupId, docUpdateFn)
  await radio.emit(`group:${action}`, groupId, reqUserId, secondaryUserId)
}

initMembershipUpdateHooks()
