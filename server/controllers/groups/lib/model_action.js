import Group from '#models/group'
import radio from '#lib/radio'
import dbFactory from '#db/couchdb/base'
import initMembershipUpdateHooks from './membership_update_hooks.js'

const db = dbFactory('groups')

export default async (action, params) => {
  const { reqUserId, group: groupId, user: secondaryUserId } = params
  const docUpdateFn = Group[action].bind(null, reqUserId, secondaryUserId)
  await db.update(groupId, docUpdateFn)
  await radio.emit(`group:${action}`, groupId, reqUserId, secondaryUserId)
}

initMembershipUpdateHooks()
