import _ from '#builders/utils'
import groupAction from '#controllers/groups/lib/model_action'
import { makeRequest } from '#controllers/relations/lib/actions'
import { findOneByEmail, byEmails } from '#controllers/user/lib/shared_user_handlers'
import dbFactory from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import { log, LogError, LogErrorAndRethrow } from '#lib/utils/logs'
import Invited from '#models/invited'

const db = dbFactory('users', 'invited')

const invitations_ = {
  findOneByEmail: findOneByEmail.bind(null, db),

  byEmails: byEmails.bind(null, db),

  createUnknownInvited: (inviterId, groupId, unknownEmails) => {
    assert_.string(inviterId)
    assert_.array(unknownEmails)
    if (groupId) assert_.string(groupId)
    const invitedDocs = unknownEmails.map(Invited.create(inviterId, groupId))
    return db.bulk(invitedDocs)
    .catch(LogErrorAndRethrow('createUnknownInvited'))
  },

  addInviter: (inviterId, groupId, invitedDocs) => {
    assert_.types([ 'string', 'array' ], [ inviterId, invitedDocs ])
    if (groupId != null) { assert_.string(groupId) }
    const addInviterFn = Invited.addInviter.bind(null, inviterId, groupId)
    invitedDocs = invitedDocs.map(addInviterFn)
    return db.bulk(invitedDocs)
    .catch(LogErrorAndRethrow('addInviter'))
  },

  convertInvitations: async userDoc => {
    const { _id: userId, inviters } = userDoc
    let { invitersGroups } = userDoc

    if (inviters == null && invitersGroups == null) return

    invitersGroups = invitersGroups || {}
    const groupInvitersIds = Object.values(invitersGroups)
    log(groupInvitersIds, 'groupInvitersIds')

    const invitersIds = _.difference(Object.keys(inviters), groupInvitersIds)
    log(invitersIds, 'invitersIds')

    const friendsPromises = convertFriendInvitations(invitersIds, userId)
    const groupsPromises = convertGroupsInvitations(invitersGroups, userId)

    return Promise.all(friendsPromises.concat(groupsPromises))
  },

  stopEmails: email => {
    return invitations_.findOneByEmail(email)
    .then(doc => db.update(doc._id, Invited.stopEmails))
    .catch(LogErrorAndRethrow('stopEmails'))
  },
}

export default invitations_

const emailNotification = false
const convertFriendInvitations = (invitersIds, newUserId) => {
  return invitersIds
  .map(inviterId => {
    return makeRequest(inviterId, newUserId, emailNotification)
    // Prevent crashing the signup request for one failed request
    .catch(LogError(`friend invitation convertion err: ${inviterId}/${newUserId}`))
  })
}

const convertGroupsInvitations = (invitersGroups, newUserId) => {
  return Object.keys(invitersGroups)
  .map(groupId => {
    const inviterId = invitersGroups[groupId]
    return groupAction('invite', { reqUserId: inviterId, group: groupId, user: newUserId })
    .catch(LogError(`group invitation convertion err: ${inviterId}/${newUserId}`))
  })
}
