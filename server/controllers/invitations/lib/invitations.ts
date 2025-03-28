import { difference } from 'lodash-es'
import { groupAction } from '#controllers/groups/lib/group_action'
import { makeRequest } from '#controllers/relations/lib/actions'
import { findOneByEmail, byEmails } from '#controllers/user/lib/shared_user_handlers'
import { dbFactory } from '#db/couchdb/base'
import { assertArray, assertTypes, assertString } from '#lib/utils/assert_types'
import { log, LogError, LogErrorAndRethrow } from '#lib/utils/logs'
import Invited from '#models/invited'
import type { InvitedUser } from '#types/user'

const db = await dbFactory('users', 'invited')

export const findInvitationByEmail = email => findOneByEmail<InvitedUser>(db, email)

export const getInvitationsByEmails = email => byEmails<InvitedUser>(db, email)

export function createUnknownInvited (inviterId, groupId, unknownEmails) {
  assertString(inviterId)
  assertArray(unknownEmails)
  if (groupId) assertString(groupId)
  const invitedDocs = unknownEmails.map(Invited.create(inviterId, groupId))
  return db.bulk(invitedDocs)
  .catch(LogErrorAndRethrow('createUnknownInvited'))
}

export function addInviter (inviterId, groupId, invitedDocs) {
  assertTypes([ 'string', 'array' ], [ inviterId, invitedDocs ])
  if (groupId != null) { assertString(groupId) }
  const addInviterFn = Invited.addInviter.bind(null, inviterId, groupId)
  invitedDocs = invitedDocs.map(addInviterFn)
  return db.bulk(invitedDocs)
  .catch(LogErrorAndRethrow('addInviter'))
}

export async function convertInvitations (userDoc) {
  const { _id: userId, inviters } = userDoc
  let { invitersGroups } = userDoc

  if (inviters == null && invitersGroups == null) return

  invitersGroups ??= {}
  const groupInvitersIds = Object.values(invitersGroups)
  log(groupInvitersIds, 'groupInvitersIds')

  const invitersIds = difference(Object.keys(inviters), groupInvitersIds)
  log(invitersIds, 'invitersIds')

  const friendsPromises = convertFriendInvitations(invitersIds, userId)
  const groupsPromises = convertGroupsInvitations(invitersGroups, userId)

  return Promise.all(friendsPromises.concat(groupsPromises))
}

export async function stopInvitationEmails (email) {
  const doc = await findInvitationByEmail(email)
  await db.update(doc._id, Invited.stopEmails)
}

const emailNotification = false
function convertFriendInvitations (invitersIds, newUserId) {
  return invitersIds
  .map(inviterId => {
    return makeRequest(inviterId, newUserId, emailNotification)
    // Prevent crashing the signup request for one failed request
    .catch(LogError(`friend invitation convertion err: ${inviterId}/${newUserId}`))
  })
}

function convertGroupsInvitations (invitersGroups, newUserId) {
  return Object.keys(invitersGroups)
  .map(groupId => {
    const inviterId = invitersGroups[groupId]
    return groupAction('invite', { reqUserId: inviterId, group: groupId, user: newUserId })
    .catch(LogError(`group invitation convertion err: ${inviterId}/${newUserId}`))
  })
}
