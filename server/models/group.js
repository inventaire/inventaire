CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Group = {}

Group.validations = validations = require './validations/group'

Group.create = (options)->
  _.log options, 'group create'
  { name, description, searchable, position, creatorId } = options
  validations.pass 'name', name
  validations.pass 'description', description
  validations.pass 'searchable', searchable
  validations.pass 'position', position

  creator = createMembership creatorId, null

  return group =
    type: 'group'
    name: name
    description: description
    searchable: searchable
    admins: [ creator ]
    members: []
    invited: []
    declined: []
    requested: []
    position: position
    creator: creatorId
    # using the same timestamp for clarity
    created: creator.timestamp

Group.findInvitation = (userId, group, wanted)->
  findMembership userId, group, 'invited', wanted

inviteSection = if CONFIG.godMode then 'members' else 'invited'
membershipActions =
  invite: (invitorId, invitedId, group)->
    # Using Group.findInvitation as a validator throwing
    # if the document isn't in the desired state
    Group.findInvitation invitedId, group, false
    group[inviteSection].push createMembership(invitedId, invitorId)
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
  leave: (userId, placeholder, group)->
    role = if userIsAdmin userId, group then 'admins' else 'members'
    moveMembership userId, group, role, null

Group.membershipActionsList = Object.keys membershipActions
_.extend Group, membershipActions

# create user's membership object that will be moved between categories
createMembership = (userId, invitorId)->
  user: userId
  invitor: invitorId
  timestamp: Date.now()

# moving membership object from previousCategory to newCategory
moveMembership = (userId, group, previousCategory, newCategory)->
  membership = findMembership userId, group, previousCategory, true
  group[previousCategory] = _.without group[previousCategory], membership
  # let the possibility to just destroy the membership
  # by letting newCategory undefined
  if newCategory? then group[newCategory].push membership
  return group

findMembership = (userId, group, previousCategory, wanted)->
  membership = _.find group[previousCategory], { user: userId }
  if wanted
    # expect to find a membership
    if membership? then return membership
    else
      context = { userId }
      context[previousCategory] = group[previousCategory]
      throw error_.new 'membership not found', 403, context
  else
    # expect to find no existing membership
    if membership?
      # return a 200 to avoid to show an error on client-side
      # while the membership does exist
      context = { groupId: group._id, userId }
      throw error_.new 'membership already exist', 200, context
    else return

userIsRole = (role)-> (userId, group)->
  ids = group[role].map _.property('user')
  return userId in ids

Group.userIsAdmin = userIsAdmin = userIsRole 'admins'
userIsNonAdminMember = userIsRole 'members'

Group.userIsMember = (userId, group)->
  return userIsAdmin(userId, group) or userIsNonAdminMember(userId, group)

Group.categories =
  members: [ 'admins', 'members' ]
  users: [ 'admins', 'members', 'invited', 'requested' ]

Group.attributes = require './attributes/group'
