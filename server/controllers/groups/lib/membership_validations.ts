import { getInvitedUser } from '#controllers/groups/lib/groups'
import { userCanLeaveGroup } from '#controllers/groups/lib/leave_groups'
import { userIsInAdmins, userIsInGroup, userIsInGroupOrRequested, userIsInRequested } from '#controllers/groups/lib/users_lists'
import { newError } from '#lib/error/error'

const validateRequestDecision = (reqUserId, groupId, requesterId) => {
  return Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInRequested(requesterId, groupId),
  ])
  .then(([ userInAdmins, requesterInRequested ]) => {
    if (!userInAdmins) {
      throw newError('user is not admin', 403, { reqUserId, groupId })
    }
    if (!requesterInRequested) {
      throw newError('request not found', 401, { requesterId, groupId })
    }
  })
}

const validateInvite = (reqUserId, groupId, invitedUserId) => {
  return userIsInGroup(reqUserId, groupId)
  .then(invitorInGroup => {
    if (!invitorInGroup) {
      const context = { reqUserId, groupId, invitedUserId }
      throw newError("invitor isn't in group", 403, { context })
    }
  })
}

const validateAdmin = (reqUserId, groupId) => {
  return userIsInAdmins(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw newError('user is not a group admin', 403, { reqUserId, groupId })
    }
  })
}

const validateAdminWithoutAdminsConflict = (reqUserId, groupId, targetId) => {
  return Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInAdmins(targetId, groupId),
  ])
  .then(([ userIsAdmin, targetIsAdmin ]) => {
    if (!userIsAdmin) {
      throw newError('user is not a group admin', 403, { reqUserId, groupId })
    }
    if (targetIsAdmin) {
      throw newError('target user is also a group admin', 403, { reqUserId, groupId, targetId })
    }
  })
}

const validateLeaving = (reqUserId, groupId) => {
  return Promise.all([
    userIsInGroup(reqUserId, groupId),
    userCanLeaveGroup(reqUserId, groupId),
  ])
  .then(([ userInGroup, userCanLeave ]) => {
    if (!userInGroup) {
      throw newError('user is not in the group', 403, { reqUserId, groupId })
    }
    if (!userCanLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw newError(message, 403, { reqUserId, groupId })
    }
  })
}

const validateRequest = (reqUserId, groupId) => {
  return userIsInGroupOrRequested(reqUserId, groupId)
  .then(bool => {
    if (bool) {
      throw newError('user is already in group', 403, { reqUserId, groupId })
    }
  })
}

const validateCancelRequest = (reqUserId, groupId) => {
  return userIsInRequested(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw newError('request not found', 403, { reqUserId, groupId })
    }
  })
}

export default {
  invite: validateInvite,
  // /!\ getInvitedUser returns a group doc, not a boolean
  accept: getInvitedUser,
  decline: getInvitedUser,
  request: validateRequest,
  cancelRequest: validateCancelRequest,
  acceptRequest: validateRequestDecision,
  refuseRequest: validateRequestDecision,
  updateSettings: validateAdmin,
  makeAdmin: validateAdmin,
  kick: validateAdminWithoutAdminsConflict,
  leave: validateLeaving,
}
