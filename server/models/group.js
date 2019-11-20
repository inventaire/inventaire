
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Group, userIsAdmin, validations
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')

module.exports = (Group = {})

Group.validations = (validations = require('./validations/group'))

Group.create = options => {
  _.log(options, 'group create')
  const { name, description, searchable, position, creatorId } = options
  validations.pass('name', name)
  validations.pass('description', description)
  validations.pass('searchable', searchable)
  validations.pass('position', position)

  const creator = createMembership(creatorId, null)

  return {
    type: 'group',
    name,
    description,
    searchable,
    admins: [ creator ],
    members: [],
    invited: [],
    declined: [],
    requested: [],
    position,
    creator: creatorId,
    // using the same timestamp for clarity
    created: creator.timestamp
  }
}

Group.findInvitation = (userId, group, wanted) => findMembership(userId, group, 'invited', wanted)

const inviteSection = CONFIG.godMode ? 'members' : 'invited'
const membershipActions = {
  invite: (invitorId, invitedId, group) => {
    // Using Group.findInvitation as a validator throwing
    // if the document isn't in the desired state
    Group.findInvitation(invitedId, group, false)
    group[inviteSection].push(createMembership(invitedId, invitorId))
    return group
  },

  // there is room for a secondaryUserId but only some actions actually need it:
  // the empty variable is thus passed to 'placeholder'
  accept: (userId, placeholder, group) => {
    return moveMembership(userId, group, 'invited', 'members')
  },
  decline: (userId, placeholder, group) => {
    return moveMembership(userId, group, 'invited', 'declined')
  },
  request: (userId, placeholder, group) => {
    group.requested.push(createMembership(userId, null))
    return group
  },
  cancelRequest: (userId, placeholder, group) => {
    return moveMembership(userId, group, 'requested', null)
  },
  acceptRequest: (adminId, requesterId, group) => {
    return moveMembership(requesterId, group, 'requested', 'members')
  },
  refuseRequest: (adminId, requesterId, group) => {
    return moveMembership(requesterId, group, 'requested', null)
  },
  makeAdmin: (adminId, memberId, group) => {
    return moveMembership(memberId, group, 'members', 'admins')
  },
  kick: (adminId, memberId, group) => {
    return moveMembership(memberId, group, 'members', null)
  },
  leave: (userId, placeholder, group) => {
    const role = userIsAdmin(userId, group) ? 'admins' : 'members'
    return moveMembership(userId, group, role, null)
  }
}

Group.membershipActionsList = Object.keys(membershipActions)
Object.assign(Group, membershipActions)

// create user's membership object that will be moved between categories
const createMembership = (userId, invitorId) => ({
  user: userId,
  invitor: invitorId,
  timestamp: Date.now()
})

// moving membership object from previousCategory to newCategory
const moveMembership = (userId, group, previousCategory, newCategory) => {
  const membership = findMembership(userId, group, previousCategory, true)
  group[previousCategory] = _.without(group[previousCategory], membership)
  // let the possibility to just destroy the membership
  // by letting newCategory undefined
  if (newCategory != null) { group[newCategory].push(membership) }
  return group
}

const findMembership = (userId, group, previousCategory, wanted) => {
  let context
  const membership = _.find(group[previousCategory], { user: userId })
  if (wanted) {
    // expect to find a membership
    if (membership != null) {
      return membership
    } else {
      context = { userId }
      context[previousCategory] = group[previousCategory]
      throw error_.new('membership not found', 403, context)
    }
  } else {
    // expect to find no existing membership
    if (membership != null) {
      // return a 200 to avoid to show an error on client-side
      // while the membership does exist
      context = { groupId: group._id, userId }
      throw error_.new('membership already exist', 200, context)
    } else {

    }
  }
}

const userIsRole = role => (userId, group) => {
  const ids = group[role].map(_.property('user'))
  return ids.includes(userId)
}

Group.userIsAdmin = (userIsAdmin = userIsRole('admins'))
const userIsNonAdminMember = userIsRole('members')

Group.userIsMember = (userId, group) => userIsAdmin(userId, group) || userIsNonAdminMember(userId, group)

Group.categories = {
  members: [ 'admins', 'members' ],
  users: [ 'admins', 'members', 'invited', 'requested' ]
}

Group.attributes = require('./attributes/group')
