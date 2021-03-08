const CONFIG = require('config')
const __ = CONFIG.universalPath
const Group = __.require('models', 'group')
const radio = __.require('lib', 'radio')
const initMembershipUpdateHooks = require('./membership_update_hooks')
const db = __.require('db', 'couchdb/base')('groups')

module.exports = (action, params) => {
  const { reqUserId, group: groupId, user: secondaryUserId } = params
  const docUpdateFn = Group[action].bind(null, reqUserId, secondaryUserId)
  return db.update(groupId, docUpdateFn)
  .then(() => {
    radio.emit(`group:${action}`, groupId, reqUserId, secondaryUserId)
  })
}

initMembershipUpdateHooks()
