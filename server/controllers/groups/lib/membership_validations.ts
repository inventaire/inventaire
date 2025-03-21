import { getInvitedUser } from '#controllers/groups/lib/groups'
import { userCanLeaveGroup } from '#controllers/groups/lib/leave_groups'
import { userIsInAdmins, userIsInGroup, userIsInGroupOrRequested, userIsInRequested } from '#controllers/groups/lib/users_lists'
import { newError } from '#lib/error/error'
import type { GroupId } from '#types/group'
import type { UserId } from '#types/user'

async function validateRightToAcceptOrRefuseRequest (reqUserId: UserId, groupId: GroupId, requesterId: UserId) {
  const [ userInAdmins, requesterInRequested ] = await Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInRequested(requesterId, groupId),
  ])
  if (!userInAdmins) {
    throw newError('user is not admin', 403, { reqUserId, groupId })
  }
  if (!requesterInRequested) {
    throw newError('request not found', 401, { requesterId, groupId })
  }
}

async function validateRightToInvite (reqUserId: UserId, groupId: GroupId, invitedUserId: UserId) {
  const invitorInGroup = await userIsInGroup(reqUserId, groupId)
  if (!invitorInGroup) {
    const context = { reqUserId, groupId, invitedUserId }
    throw newError("invitor isn't in group", 403, { context })
  }
}

async function validateAdminRights (reqUserId: UserId, groupId: GroupId) {
  const bool = await userIsInAdmins(reqUserId, groupId)
  if (!bool) {
    throw newError('user is not a group admin', 403, { reqUserId, groupId })
  }
}

async function validateRightToKick (reqUserId: UserId, groupId: GroupId, targetId: UserId) {
  const [ userIsAdmin, targetIsAdmin ] = await Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInAdmins(targetId, groupId),
  ])
  if (!userIsAdmin) {
    throw newError('user is not a group admin', 403, { reqUserId, groupId })
  }
  if (targetIsAdmin) {
    throw newError('target user is also a group admin', 403, { reqUserId, groupId, targetId })
  }
}

async function validateRightToLeaving (reqUserId: UserId, groupId: GroupId) {
  const [ userInGroup, userCanLeave ] = await Promise.all([
    userIsInGroup(reqUserId, groupId),
    userCanLeaveGroup(reqUserId, groupId),
  ])
  if (!userInGroup) {
    throw newError('user is not in the group', 403, { reqUserId, groupId })
  }
  if (!userCanLeave) {
    const message = "the last group admin can't leave before naming another admin"
    throw newError(message, 403, { reqUserId, groupId })
  }
}

async function validateRightToRequestToJoin (reqUserId: UserId, groupId: GroupId) {
  const bool = await userIsInGroupOrRequested(reqUserId, groupId)
  if (bool) {
    throw newError('user is already in group', 403, { reqUserId, groupId })
  }
}

async function validateRightToCancelRequest (reqUserId: UserId, groupId: GroupId) {
  const bool = await userIsInRequested(reqUserId, groupId)
  if (!bool) {
    throw newError('request not found', 403, { reqUserId, groupId })
  }
}

async function validateRightToAcceptOrDeclineInvitation (reqUserId: UserId, groupId: GroupId) {
  const invitation = await getInvitedUser(reqUserId, groupId)
  return invitation != null
}

export default {
  invite: validateRightToInvite,
  accept: validateRightToAcceptOrDeclineInvitation,
  decline: validateRightToAcceptOrDeclineInvitation,
  request: validateRightToRequestToJoin,
  cancelRequest: validateRightToCancelRequest,
  acceptRequest: validateRightToAcceptOrRefuseRequest,
  refuseRequest: validateRightToAcceptOrRefuseRequest,
  updateSettings: validateAdminRights,
  makeAdmin: validateAdminRights,
  kick: validateRightToKick,
  leave: validateRightToLeaving,
}
