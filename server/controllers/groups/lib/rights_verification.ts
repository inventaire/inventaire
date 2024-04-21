import { userCanLeaveGroup } from '#controllers/groups/lib/leave_groups'
import { userIsInAdmins, userIsInGroup, userIsInRequested } from '#controllers/groups/lib/users_lists'
import { newError } from '#lib/error/error'
import { getInvitedUser } from './groups.js'

function validateJoinRequestHandlingRights (reqUserId, groupId, requesterId) {
  return Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInRequested(requesterId, groupId),
  ])
  .then(([ userInAdmins, requesterInRequested ]) => {
    if (!userInAdmins) {
      throw newError('user isnt admin', 403, { reqUserId, groupId })
    }
    if (!requesterInRequested) {
      throw newError('request not found', 401, { requesterId, groupId })
    }
  })
}

function validateAdminRights (reqUserId, groupId) {
  return userIsInAdmins(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw newError('user isnt a group admin', 403, { reqUserId, groupId })
    }
  })
}

function validateAdminRightsWithoutAdminsConflict (reqUserId, groupId, targetId) {
  Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInAdmins(targetId, groupId),
  ])
  .then(([ userIsAdmin, targetIsAdmin ]) => {
    if (!userIsAdmin) {
      throw newError('user isnt a group admin', 403, { reqUserId, groupId })
    }
    if (targetIsAdmin) {
      throw newError('target user is also a group admin', 403, { reqUserId, groupId, targetId })
    }
  })
}

function validateUserRightToLeave (reqUserId, groupId) {
  return Promise.all([
    userIsInGroup(reqUserId, groupId),
    userCanLeaveGroup(reqUserId, groupId),
  ])
  .then(([ userInGroup, userCanLeave ]) => {
    if (!userInGroup) {
      throw newError('user isnt in the group', 403, { reqUserId, groupId })
    }
    if (!userCanLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw newError(message, 403, { reqUserId, groupId })
    }
  })
}

function validateRequest (reqUserId, groupId) {
  return userIsInGroup(reqUserId, groupId)
  .then(bool => {
    if (bool) {
      throw newError('user is already in group', 403, { reqUserId, groupId })
    }
  })
}

function validateCancelRequest (reqUserId, groupId) {
  return userIsInRequested(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw newError('request not found', 403, { reqUserId, groupId })
    }
  })
}

export default {
  // /!\ getInvitedUser returns a group doc, not a boolean
  accept: getInvitedUser,
  decline: getInvitedUser,
  request: validateRequest,
  cancelRequest: validateCancelRequest,
  acceptRequest: validateJoinRequestHandlingRights,
  refuseRequest: validateJoinRequestHandlingRights,
  updateSettings: validateAdminRights,
  makeAdmin: validateAdminRights,
  kick: validateAdminRightsWithoutAdminsConflict,
  leave: validateUserRightToLeave,
}
