import dbFactory from '#db/couchdb/base'
import { emit } from '#lib/radio'
import Group from '#models/group'
import initMembershipUpdateHooks from './membership_update_hooks.js'

const db = dbFactory('groups')

export default async (action, params) => {
  const { reqUserId, group: groupId, user: secondaryUserId } = params
  const docUpdateFn = Group[action].bind(null, reqUserId, secondaryUserId)
  await db.update(groupId, docUpdateFn)
  await emit(`group:${action}`, groupId, reqUserId, secondaryUserId)
}

initMembershipUpdateHooks()
