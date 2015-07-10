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
      @byUser(userId)
      @byInvitedUser(userId)
    ]
    .spread _.union.bind(_)

  create: (name, creatorId)->
    group = Group.create name, creatorId
    _.log group, 'group created'
    db.postAndReturn group

  findUserGroupsCoMembers: (userId)->
    @byUser userId
    .then groups_.allGroupsMembers
    # .then _.Log('allGroupsMembers')

  userInGroup: (userId, groupId)->
    @byId groupId
    .then groups_.allGroupMembers
    .then (users)-> userId in users

  userInvited: (userId, groupId)->
    @byId groupId
    .then _.partial(Group.findInvitation, userId, _, true)

  invite: (groupId, invitorId, invitedId)->
    db.update groupId, Group.invite.bind(null, invitorId, invitedId)

  answerInvitation: (userId, groupId, action)->
    # action = 'accept' or 'decline'
    db.update groupId, Group[action].bind(null, userId)

  allGroupsMembers: (groups)->
    return _(groups).map(groups_.allGroupMembers).flatten().value()

  allGroupMembers: (group)->
    _(group).pick(['admins', 'members']).values().flatten()
    .map _.property('user')
    .value()
