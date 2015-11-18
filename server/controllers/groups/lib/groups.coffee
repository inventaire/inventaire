CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Group = __.require 'models', 'group'

db = __.require('couch', 'base')('users', 'groups')

groups_ =
  # using a view to avoid returning users or relations
  byId: db.viewFindOneByKey.bind(db, 'byId')
  byUser: db.viewByKey.bind(db, 'byUser')
  byInvitedUser: db.viewByKey.bind(db, 'byInvitedUser')

  # including invitations
  allUserGroups: (userId)->
    promises_.all [
      groups_.byUser(userId)
      groups_.byInvitedUser(userId)
    ]
    .spread _.union.bind(_)

  create: (name, creatorId)->
    group = Group.create name, creatorId
    _.log group, 'group created'
    db.postAndReturn group

  findUserGroupsCoMembers: (userId)->
    groups_.byUser userId
    .then groups_.allGroupsMembers
    # .then _.Log('allGroupsMembers')

  userInvited: (userId, groupId)->
    groups_.byId groupId
    .then _.partial(Group.findInvitation, userId, _, true)

  userCanLeave: (userId, groupId)->
    groups_.byId groupId
    .then (group)->
      { admins, members } = group
      adminsIds = admins.map _.property('user')
      unless userId in adminsIds then return true
      mainUserIsTheOnlyAdmin = admins.length is 1
      thereAreOtherMembers = members.length > 0
      if mainUserIsTheOnlyAdmin and thereAreOtherMembers then false
      else true

  leaveAllGroups: (userId)->
    # TODO: check if userCanLeave
    groups_.byUser userId
    .map removeUser.bind(null, userId)
    .then db.bulk.bind(db)

removeUser = (userId, groupDoc)->
  if userId in groupDoc.admins
    _.warn arguments, "removing a user from a group she's admin of"

  Group.attributes.usersLists.forEach (list)->
    groupDoc[list] = _.without groupDoc[list], userId

  return groupDoc

membershipActions = require('./membership_actions')(db)
usersLists = require('./users_lists')(groups_)
updateGroup = require('./update_group')(db)

counts =
  pendingGroupInvitationsCount: (userId)->
    groups_.byInvitedUser userId
    .then _.property('length')

module.exports = _.extend groups_, membershipActions, usersLists, counts,
  updateSettings: updateGroup
