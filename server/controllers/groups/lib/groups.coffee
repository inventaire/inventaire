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

  invite: (groupId, invitorId, invitedId)->
    db.update groupId, Group.invite.bind(null, invitorId, invitedId)

  membershipUpdate: (action, groupId, userId, secondaryUserId)->
    db.update groupId, Group[action].bind(null, userId, secondaryUserId)

actions =
  accept: groups_.membershipUpdate.bind(null, 'accept')
  decline: groups_.membershipUpdate.bind(null, 'decline')
  request: groups_.membershipUpdate.bind(null, 'request')
  cancelRequest: groups_.membershipUpdate.bind(null, 'cancelRequest')
  acceptRequest: groups_.membershipUpdate.bind(null, 'acceptRequest')
  refuseRequest: groups_.membershipUpdate.bind(null, 'refuseRequest')

usersLists = require('./users_lists')(groups_)

module.exports = _.extend groups_, actions, usersLists
