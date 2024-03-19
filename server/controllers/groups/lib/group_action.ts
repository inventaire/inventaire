import dbFactory from '#db/couchdb/base'
import { emit } from '#lib/radio'
import { groupMembershipActions } from '#models/group'
import initMembershipUpdateHooks from './membership_update_hooks.js'

const db = await dbFactory('groups')

export async function groupAction (action, params) {
  const { reqUserId, group: groupId, user: secondaryUserId } = params
  const docUpdateFn = groupMembershipActions[action].bind(null, reqUserId, secondaryUserId)
  await db.update(groupId, docUpdateFn)
  await emit(`group:${action}`, groupId, reqUserId, secondaryUserId)
}

initMembershipUpdateHooks()
