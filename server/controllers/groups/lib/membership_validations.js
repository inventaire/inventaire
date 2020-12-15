const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const groups_ = require('./groups')
const lists_ = require('./users_lists')
const leave_ = require('./leave_groups')

const validateRequestDecision = (reqUserId, groupId, requesterId) => {
  return Promise.all([
    lists_.isAdmin(reqUserId, groupId),
    lists_.isInRequested(requesterId, groupId)
  ])
  .then(([ isAdmin, requesterInRequested ]) => {
    if (!isAdmin) {
      throw error_.new('user is not admin', 403, reqUserId, groupId)
    }
    if (!requesterInRequested) {
      throw error_.new('request not found', 401, requesterId, groupId)
    }
  })
}

const validateInvite = (reqUserId, groupId, invitedUserId) => {
  return lists_.isMember(reqUserId, groupId)
  .then(invitorInGroup => {
    if (!invitorInGroup) {
      const context = { reqUserId, groupId, invitedUserId }
      throw error_.new("invitor isn't in group", 403, context)
    }
  })
}

const validateAdmin = (reqUserId, groupId) => {
  return lists_.isAdmin(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('user is not a group admin', 403, reqUserId, groupId)
    }
  })
}

const validateAdminWithoutAdminsConflict = (reqUserId, groupId, targetId) => {
  return Promise.all([
    lists_.isAdmin(reqUserId, groupId),
    lists_.isAdmin(targetId, groupId)
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
  return Promise.all([
    lists_.isMember(reqUserId, groupId),
    leave_.canLeave(reqUserId, groupId)
  ])
  .then(([ isMember, canLeave ]) => {
    if (!isMember) {
      throw error_.new('user is not in the group', 403, reqUserId, groupId)
    }
    if (!canLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw error_.new(message, 403, reqUserId, groupId)
    }
  })
}

const validateRequest = (reqUserId, groupId) => {
  return lists_.isInGroup(reqUserId, groupId)
  .then(bool => {
    if (bool) {
      throw error_.new('user is already in group', 403, reqUserId, groupId)
    }
  })
}

const validateCancelRequest = (reqUserId, groupId) => {
  return lists_.isInRequested(reqUserId, groupId)
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
