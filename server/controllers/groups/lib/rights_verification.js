import { userIsInAdmins, userIsInGroup, userIsInRequested } from '#controllers/groups/lib/users_lists'
import { error_ } from '#lib/error/error'
import groups_ from './groups.js'
import leave_ from './lib/leave_groups.js'

const validateJoinRequestHandlingRights = (reqUserId, groupId, requesterId) => {
  return Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInRequested(requesterId, groupId),
  ])
  .then(([ userInAdmins, requesterInRequested ]) => {
    if (!userInAdmins) {
      throw error_.new('user isnt admin', 403, reqUserId, groupId)
    }
    if (!requesterInRequested) {
      throw error_.new('request not found', 401, requesterId, groupId)
    }
  })
}

const validateAdminRights = (reqUserId, groupId) => {
  return userIsInAdmins(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('user isnt a group admin', 403, reqUserId, groupId)
    }
  })
}

const validateAdminRightsWithoutAdminsConflict = (reqUserId, groupId, targetId) => {
  Promise.all([
    userIsInAdmins(reqUserId, groupId),
    userIsInAdmins(targetId, groupId),
  ])
  .then(([ userIsAdmin, targetIsAdmin ]) => {
    if (!userIsAdmin) {
      throw error_.new('user isnt a group admin', 403, reqUserId, groupId)
    }
    if (targetIsAdmin) {
      throw error_.new('target user is also a group admin', 403, reqUserId, groupId, targetId)
    }
  })
}

const validateUserRightToLeave = (reqUserId, groupId) => {
  return Promise.all([
    userIsInGroup(reqUserId, groupId),
    leave_.userCanLeave(reqUserId, groupId),
  ])
  .then(([ userInGroup, userCanLeave ]) => {
    if (!userInGroup) {
      throw error_.new('user isnt in the group', 403, reqUserId, groupId)
    }
    if (!userCanLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw error_.new(message, 403, reqUserId, groupId)
    }
  })
}

const validateRequest = (reqUserId, groupId) => {
  return userIsInGroup(reqUserId, groupId)
  .then(bool => {
    if (bool) {
      throw error_.new('user is already in group', 403, reqUserId, groupId)
    }
  })
}

const validateCancelRequest = (reqUserId, groupId) => {
  return userIsInRequested(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('request not found', 403, reqUserId, groupId)
    }
  })
}

export default {
  // /!\ groups_.userInvited returns a group doc, not a boolean
  accept: groups_.userInvited,
  decline: groups_.userInvited,
  request: validateRequest,
  cancelRequest: validateCancelRequest,
  acceptRequest: validateJoinRequestHandlingRights,
  refuseRequest: validateJoinRequestHandlingRights,
  updateSettings: validateAdminRights,
  makeAdmin: validateAdminRights,
  kick: validateAdminRightsWithoutAdminsConflict,
  leave: validateUserRightToLeave,
}
