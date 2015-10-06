CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Group = {}

Group.tests = tests = require './tests/group'

Group.create = (name, creatorId)->
  tests.pass 'userId', creatorId
  tests.pass 'name', name

  creator = createMembership creatorId, null

  return group =
    type: 'group'
    name: name
    admins: [ creator ]
    members: []
    invited: []
    declined: []
    requested: []
    creator: creatorId
    # using the same timestamp for clarity
    created: creator.timestamp

Group.findInvitation = (userId, group, wanted)->
  findMembership userId, group, 'invited', wanted

membershipActions =
  invite: (invitorId, invitedId, group)->
    Group.findInvitation invitedId, group, false
    group.invited.push createMembership(invitedId, invitorId)
    return group

  # there is room for a secondaryUserId but only some actions actually need it:
  # the empty variable is thus passed to 'placeholder'
  accept: (userId, placeholder, group)->
    moveMembership userId, group, 'invited', 'members'
  decline: (userId, placeholder, group)->
    moveMembership userId, group, 'invited', 'declined'
  request: (userId, placeholder, group)->
    group.requested.push createMembership(userId, null)
    return group
  cancelRequest: (userId, placeholder, group)->
    moveMembership userId, group, 'requested', null
  acceptRequest: (adminId, requesterId, group)->
    moveMembership requesterId, group, 'requested', 'members'
  refuseRequest: (adminId, requesterId, group)->
    moveMembership requesterId, group, 'requested', null
  makeAdmin: (adminId, memberId, group)->
    moveMembership memberId, group, 'members', 'admins'
  kick: (adminId, memberId, group)->
    moveMembership memberId, group, 'members', null

Group.membershipActionsList = Object.keys membershipActions
_.extend Group, membershipActions

# create user's membership object that will be moved between categories
createMembership = (userId, invitorId)->
  user: userId
  invitor: invitorId
  timestamp: _.now()

# moving membership object from previousCategory to newCategory
moveMembership = (userId, group, previousCategory, newCategory)->
  membership = findMembership userId, group, previousCategory, true
  group[previousCategory] = _.without group[previousCategory], membership
  # let the possibility to just destroy the membership
  # by letting newCategory undefined
  if newCategory? then group[newCategory].push membership
  return group

findMembership = (userId, group, previousCategory, wanted)->
  membership = _.findWhere group[previousCategory], {user: userId}
  if wanted
    # expect to find a membership
    if membership? then return membership
    else throw error_.new 'membership not found', 403
  else
    # expect to find no existing membership
    if membership?
      # return a 200 to avoid to show an error on client-side
      # while the membership does exist
      throw error_.new 'membership already exist', 200
    else return


Group.categories =
  members: [ 'admins', 'members' ]
  users: [ 'admins', 'members', 'invited', 'requested' ]

Group.attributes = require './attributes/group'
