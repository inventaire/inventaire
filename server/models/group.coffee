CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

tests = require './tests/common-tests'

module.exports = Group = {}

Group.create = (name, creatorId)->
  tests.pass 'userId', creatorId
  tests.pass 'nonEmptyString', name, 60

  creator = createMembership creatorId, null

  return group =
    type: 'group'
    name: name
    admins: [ creator ]
    members: []
    invited: []
    declined: []
    creator: creatorId
    # using the same timestamp for clarity
    created: creator.timestamp

Group.invite = (invitorId, invitedId, group)->
  Group.findInvitation invitedId, group, false
  group.invited.push createMembership(invitedId, invitorId)
  return group

Group.accept = (userId, group)->
  moveMembership userId, group, 'invited', 'members'

Group.decline = (userId, group)->
  moveMembership userId, group, 'invited', 'declined'

Group.findInvitation = (userId, group, wanted)->
  findMembership userId, group, 'invited', wanted

# create user's membership object that will be moved between categories
createMembership = (userId, invitorId)->
  user: userId
  invitor: invitorId
  timestamp: _.now()

# moving membership object from previousCategory to newCategory
moveMembership = (userId, group, previousCategory, newCategory)->
  invitation = findMembership userId, group, previousCategory, true
  group[previousCategory] = _.without group[previousCategory], invitation
  group[newCategory].push invitation
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
