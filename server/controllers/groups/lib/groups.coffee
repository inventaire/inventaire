CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Group = __.require 'models', 'group'


db = __.require('couch', 'base')('users', 'groups')

module.exports = groups_ =
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

  userInGroup: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allGroupMembers
    .then (users)-> userId in users

  userInGroupOrOut: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allGroupUsers
    .then (users)-> userId in users

  userInRequested: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allRequested
    .then (users)-> userId in users

  userInvited: (userId, groupId)->
    groups_.byId groupId
    .then _.partial(Group.findInvitation, userId, _, true)

  invite: (groupId, invitorId, invitedId)->
    db.update groupId, Group.invite.bind(null, invitorId, invitedId)

  request: (groupId, userId)->
    db.update groupId, Group.request.bind(null, userId)

  cancelRequest: (groupId, userId)->
    db.update groupId, Group.cancelRequest.bind(null, userId)

  answerInvitation: (userId, groupId, action)->
    # action = 'accept' or 'decline'
    db.update groupId, Group[action].bind(null, userId)

  allGroupsMembers: (groups)->
    return _(groups).map(groups_.allGroupMembers).flatten().value()

  allGroupMembers: (group)->
    groups_.usersIdsByAgregatedCategories group, Group.categories.members

  allGroupUsers: (group)->
    groups_.usersIdsByAgregatedCategories group, Group.categories.users

  allRequested: (group)->
    groups_.usersIdsByAgregatedCategories group, ['requested']

  usersIdsByAgregatedCategories: (group, categories)->
    _.type categories, 'array'
    _(group).pick(categories).values().flatten()
    .map _.property('user')
    .value()
