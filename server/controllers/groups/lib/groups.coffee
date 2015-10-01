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


updateGroup = require('./update_group')(db)
MembershipUpdate = require('./membership_update')(db)

actions =
  invite: MembershipUpdate 'invite'
  accept: MembershipUpdate 'accept'
  decline: MembershipUpdate 'decline'
  request: MembershipUpdate 'request'
  cancelRequest: MembershipUpdate 'cancelRequest'
  acceptRequest: MembershipUpdate 'acceptRequest'
  refuseRequest: MembershipUpdate 'refuseRequest'
  updateSettings: updateGroup

usersLists = require('./users_lists')(groups_)

module.exports = _.extend groups_, actions, usersLists
