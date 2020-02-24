const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const groups_ = require('./groups')
const promises_ = __.require('lib', 'promises')
const lists_ = require('./users_lists')
const leave_ = require('./leave_groups')

const validateRequestDecision = (reqUserId, groupId, requesterId) => {
  return promises_.all([
    lists_.userInAdmins(reqUserId, groupId),
    lists_.userInRequested(requesterId, groupId)
  ])
  .then(([ userInAdmins, requesterInRequested ]) => {
    if (!userInAdmins) {
      throw error_.new('user is not admin', 403, reqUserId, groupId)
    }
    if (!requesterInRequested) {
      throw error_.new('request not found', 401, requesterId, groupId)
    }
  })
}

const validateInvite = (reqUserId, groupId, invitedUserId) => {
  return lists_.userInGroup(reqUserId, groupId)
  .then(invitorInGroup => {
    if (!invitorInGroup) {
      const context = { reqUserId, groupId, invitedUserId }
      throw error_.new("invitor isn't in group", 403, context)
    }
  })
}

const validateAdmin = (reqUserId, groupId) => {
  return lists_.userInAdmins(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('user is not a group admin', 403, reqUserId, groupId)
    }
  })
}

const validateAdminWithoutAdminsConflict = (reqUserId, groupId, targetId) => {
  return promises_.all([
    lists_.userInAdmins(reqUserId, groupId),
    lists_.userInAdmins(targetId, groupId)
  ])
  .then(([ userIsAdmin, targetIsAdmin ]) => {
    if (!userIsAdmin) {
      throw error_.new('user is not a group admin', 403, reqUserId, groupId)
    }
    if (targetIsAdmin) {
      throw error_.new('target user is also a group admin', 403, reqUserId, groupId, targetId)
    }
  })
}

const validateLeaving = (reqUserId, groupId) => {
  return promises_.all([
    lists_.userInGroup(reqUserId, groupId),
    leave_.userCanLeave(reqUserId, groupId)
  ])
  .then(([ userInGroup, userCanLeave ]) => {
    if (!userInGroup) {
      throw error_.new('user is not in the group', 403, reqUserId, groupId)
    }
    if (!userCanLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw error_.new(message, 403, reqUserId, groupId)
    }
  })
}

const validateRequest = (reqUserId, groupId) => {
  return lists_.userInGroupOrOut(reqUserId, groupId)
  .then(bool => {
    if (bool) {
      throw error_.new('user is already in group', 403, reqUserId, groupId)
    }
  })
}

const validateCancelRequest = (reqUserId, groupId) => {
  return lists_.userInRequested(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('request not found', 403, reqUserId, groupId)
    }
  })
}

module.exports = {
  invite: validateInvite,
  // /!\ groups_.userInvited returns a group doc, not a boolean
  accept: groups_.userInvited,
  decline: groups_.userInvited,
  request: validateRequest,
  cancelRequest: validateCancelRequest,
  acceptRequest: validateRequestDecision,
  refuseRequest: validateRequestDecision,
  updateSettings: validateAdmin,
  makeAdmin: validateAdmin,
  kick: validateAdminWithoutAdminsConflict,
  leave: validateLeaving
}
