import { getGroupById } from '#controllers/groups/lib/groups'
import { dbFactory } from '#db/couchdb/base'
import { emit } from '#lib/radio'
import { retryOnConflict } from '#lib/retry_on_conflict'
import { groupMembershipActions, type GroupMembershipAction } from '#models/group'
import initMembershipUpdateHooks from './membership_update_hooks.js'

const db = await dbFactory('groups')

export async function _groupAction (action: GroupMembershipAction, params) {
  const { reqUserId, group: groupId, user: secondaryUserId } = params
  const group = await getGroupById(groupId)
  const { actionToNotify = action } = groupMembershipActions[action](reqUserId, secondaryUserId, group) || {}
  await db.put(group)
  if (actionToNotify !== null) {
    await emit(`group:${actionToNotify}`, groupId, reqUserId, secondaryUserId)
  }
}

export const groupAction = retryOnConflict(_groupAction)

initMembershipUpdateHooks()
