const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const groups_ = require('./groups')
const lists_ = require('./users_lists')
const leave_ = require('./leave_groups')

const validateRequestDecision = (userId, groupId, requesterId) => {
  return Promise.all([
    lists_.isAdmin(userId, groupId),
    lists_.isInRequested(requesterId, groupId)
  ])
  .then(([ isAdmin, requesterInRequested ]) => {
    if (!isAdmin) {
      throw error_.new('user is not admin', 403, userId, groupId)
    }
    if (!requesterInRequested) {
      throw error_.new('request not found', 401, requesterId, groupId)
    }
  })
}

const validateInvite = (userId, groupId, invitedUserId) => {
  return lists_.isMember(userId, groupId)
  .then(invitorInGroup => {
    if (!invitorInGroup) {
      const context = { userId, groupId, invitedUserId }
      throw error_.new("invitor isn't in group", 403, context)
    }
  })
}

const validateAdmin = (userId, groupId) => {
  return lists_.isAdmin(userId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('user is not a group admin', 403, userId, groupId)
    }
  })
}

const validateMembership = (userId, groupId) => {
  return lists_.isMember(userId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('user is not a group member', 403, userId, groupId)
    }
  })
}

const validateAdminWithoutAdminsConflict = (userId, groupId, targetId) => {
  return Promise.all([
    lists_.isAdmin(userId, groupId),
    lists_.isAdmin(targetId, groupId)
  ])
  .then(([ userIsAdmin, targetIsAdmin ]) => {
    if (!userIsAdmin) {
      throw error_.new('user is not a group admin', 403, userId, groupId)
    }
    if (targetIsAdmin) {
      throw error_.new('target user is also a group admin', 403, userId, groupId, targetId)
    }
  })
}

const validateLeaving = (userId, groupId) => {
  return Promise.all([
    lists_.isMember(userId, groupId),
    leave_.canLeave(userId, groupId)
  ])
  .then(([ isMember, canLeave ]) => {
    if (!isMember) {
      throw error_.new('user is not in the group', 403, userId, groupId)
    }
    if (!canLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw error_.new(message, 403, userId, groupId)
    }
  })
}

const validateRequest = (userId, groupId) => {
  return lists_.isInGroup(userId, groupId)
  .then(bool => {
    if (bool) {
      throw error_.new('user is already in group', 403, userId, groupId)
    }
  })
}

const validateCancelRequest = (userId, groupId) => {
  return lists_.isInRequested(userId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('request not found', 403, userId, groupId)
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
  isMember: validateMembership,
  kick: validateAdminWithoutAdminsConflict,
  leave: validateLeaving
}
