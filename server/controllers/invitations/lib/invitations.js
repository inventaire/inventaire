const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const db = __.require('couch', 'base')('users', 'invited')
const { findOneByEmail, byEmails } = __.require('controllers', 'user/lib/shared_user_handlers')
const Invited = __.require('models', 'invited')
const { makeRequest } = __.require('controllers', 'relations/lib/actions')
const groupAction = __.require('controllers', 'groups/lib/model_action')

const invitations_ = module.exports = {
  findOneByEmail: findOneByEmail.bind(null, db),

  byEmails: byEmails.bind(null, db),

  createUnknownInvited: (inviterId, groupId, unknownEmails) => {
    assert_.string(inviterId)
    assert_.array(unknownEmails)
    if (groupId) assert_.string(groupId)
    const invitedDocs = unknownEmails.map(Invited.create(inviterId, groupId))
    return db.bulk(invitedDocs)
    .catch(_.ErrorRethrow('createUnknownInvited'))
  },

  addInviter: (inviterId, groupId, invitedDocs) => {
    assert_.types([ 'string', 'array' ], [ inviterId, invitedDocs ])
    if (groupId != null) { assert_.string(groupId) }
    const addInviterFn = Invited.addInviter.bind(null, inviterId, groupId)
    invitedDocs = invitedDocs.map(addInviterFn)
    return db.bulk(invitedDocs)
    .catch(_.ErrorRethrow('addInviter'))
  },

  convertInvitations: userDoc => {
    const { _id: userId, inviters } = userDoc
    let { invitersGroups } = userDoc

    if (inviters == null && invitersGroups == null) return Promise.resolve()

    invitersGroups = invitersGroups || {}
    const groupInvitersIds = _.values(invitersGroups)
    _.log(groupInvitersIds, 'groupInvitersIds')

    const invitersIds = _.difference(Object.keys(inviters), groupInvitersIds)
    _.log(invitersIds, 'invitersIds')

    const friendsPromises = convertFriendInvitations(invitersIds, userId)
    const groupsPromises = convertGroupsInvitations(invitersGroups, userId)

    return Promise.all(friendsPromises.concat(groupsPromises))
  },

  stopEmails: email => {
    return invitations_.findOneByEmail(email)
    .then(doc => db.update(doc._id, Invited.stopEmails))
    .catch(_.ErrorRethrow('stopEmails'))
  }
}

const emailNotification = false
const convertFriendInvitations = (invitersIds, newUserId) => {
  return invitersIds
  .map(inviterId => {
    return makeRequest(inviterId, newUserId, emailNotification)
    // Prevent crashing the signup request for one failed request
    .catch(_.Error(`friend invitation convertion err: ${inviterId}/${newUserId}`))
  })
}

const convertGroupsInvitations = (invitersGroups, newUserId) => {
  return Object.keys(invitersGroups)
  .map(groupId => {
    const inviterId = invitersGroups[groupId]
    return groupAction('invite', { reqUserId: inviterId, group: groupId, user: newUserId })
    .catch(_.Error(`group invitation convertion err: ${inviterId}/${newUserId}`))
  })
}
