CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('users', 'invited')
{ findOneByEmail, byEmails } = __.require 'controllers', 'user/lib/shared_user_handlers'
Invited = __.require 'models','invited'
promises_ = __.require 'lib', 'promises'
{ makeRequest } = __.require 'controllers', 'relations/lib/actions'
{ invite:groupInvite } = __.require 'controllers', 'groups/lib/groups'

module.exports = invitations_ =
  findOneByEmail: findOneByEmail.bind null, db
  byEmails: byEmails.bind null, db
  createUnknownInvited: (inviterId, groupId, unknownEmails)->
    _.types arguments, ['string', 'string|undefined', 'array']
    invitedDocs = unknownEmails.map Invited.create(inviterId, groupId)
    db.bulk invitedDocs
    .catch _.ErrorRethrow('createUnknownInvited')

  addInviter: (inviterId, groupId, invitedDocs)->
    _.types arguments, ['string', 'string|undefined', 'array']
    addInviterFn = Invited.addInviter.bind null, inviterId, groupId
    invitedDocs = invitedDocs.map addInviterFn
    db.bulk invitedDocs
    .catch _.ErrorRethrow('addInviter')

  convertInvitations: (userDoc)->
    { _id:userId, inviters, invitersGroups } = userDoc

    unless inviters? or invitersGroups? then return promises_.resolved

    invitersGroups or= {}
    groupInvitersIds = _.values invitersGroups
    _.log groupInvitersIds, 'groupInvitersIds'

    invitersIds = _.difference Object.keys(inviters), groupInvitersIds
    _.log invitersIds, 'invitersIds'

    friendsPromises = convertFriendInvitations invitersIds, userId
    groupsPromises = convertGroupsInvitations invitersGroups, userId

    return promises_.all friendsPromises.concat(groupsPromises)

  stopEmails: (email)->
    invitations_.findOneByEmail email
    .then (doc)-> db.update doc._id, Invited.stopEmails
    .catch _.ErrorRethrow('stopEmails')

emailNotification = false
convertFriendInvitations = (invitersIds, newUserId)->
  invitersIds
  .map (inviterId)->
    makeRequest inviterId, newUserId, emailNotification
    # Prevent crashing the signup request for one failed request
    .catch _.Error("friend invitation convertion err: #{inviterId}/#{newUserId}")

convertGroupsInvitations = (invitersGroups, newUserId)->
  Object.keys invitersGroups
  .map (groupId)->
    inviterId = invitersGroups[groupId]
    groupInvite { group: groupId, user: newUserId }, inviterId
    .catch _.Error("group invitation convertion err: #{inviterId}/#{newUserId}")
