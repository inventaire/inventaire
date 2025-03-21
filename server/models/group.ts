import { find, map, without } from 'lodash-es'
import { newError } from '#lib/error/error'
import { truncateLatLng } from '#lib/geo'
import { assertObject } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import { groupRoles } from '#models/attributes/group'
import type { NewCouchDoc } from '#types/couchdb'
import type { Group } from '#types/group'
import type { UserId } from '#types/user'
import groupValidations from './validations/group.js'

export type GroupCreationParams = Pick<Group, 'name' | 'description' | 'searchable' | 'position' | 'open' > & { creatorId: UserId }

export function createGroupDoc (params: GroupCreationParams) {
  log(params, 'group create')
  const { name, description, searchable, position, creatorId, open } = params
  groupValidations.pass('name', name)
  groupValidations.pass('description', description)
  groupValidations.pass('searchable', searchable)
  groupValidations.pass('position', position)
  groupValidations.pass('creatorId', creatorId)
  groupValidations.pass('open', open)

  const creator = createMembership(creatorId, null)

  return {
    // The type attribute is used in some places where group docs might be mixed with user docs
    // such as search results
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
    open,
    creator: creatorId,
    // using the same timestamp for clarity
    created: creator.timestamp,
  } as Omit<NewCouchDoc<Group>, 'slug'>
}

export const findGroupInvitation = (userId, group, wanted) => findMembership(userId, group, 'invited', wanted)

export const groupMembershipActions = {
  invite: (invitorId, invitedId, group) => {
    const { role, membership } = findUserGroupMembership(invitedId, group)
    const context = { groupId: group._id, userId: invitedId, role }
    if (role === 'requested') {
      membership.invitor = invitorId
      // If the invited user already requested to join, accept that request
      // TODO: add a allowUsersToInvite group config flag to clarify this behavior,
      // which currently gives any member the right to requalify an "invite" into an "accept request"
      moveMembership(invitedId, group, 'requested', 'members')
      // and send the "accepted" notification
      return { actionToNotify: 'acceptRequest' }
    } else if (role === 'declined') {
      throw newError('user already declined the invitation', 400, context)
    } else if (role) {
      throw newError('membership already exist', 200, context)
    }
    group.invited.push(createMembership(invitedId, invitorId))
  },

  // there is room for a secondaryUserId but only some actions actually need it:
  // the empty variable is thus passed to 'placeholder'
  accept: (userId, placeholder, group) => {
    moveMembership(userId, group, 'invited', 'members')
  },
  decline: (userId, placeholder, group) => {
    moveMembership(userId, group, 'invited', 'declined')
  },
  request: (userId, placeholder, group) => {
    const { role } = findUserGroupMembership(userId, group)
    if (role === 'invited') {
      // If the requesting user was already invited, accept that request
      moveMembership(userId, group, 'invited', 'members')
      // and no need to then send a "accepted" notification
      return { actionToNotify: null }
    } else if (role === 'declined') {
      // If the requesting user was already invited, then declined, then re-requests to join, accept that request
      moveMembership(userId, group, 'declined', 'members')
      // and no need to then send a "accepted" notification
      return { actionToNotify: null }
    } else if (role) {
      const context = { groupId: group._id, userId, role }
      throw newError('membership already exist', 200, context)
    }
    if (group.open) {
      group.members.push(createMembership(userId, null))
    } else {
      group.requested.push(createMembership(userId, null))
    }
  },
  cancelRequest: (userId, placeholder, group) => {
    moveMembership(userId, group, 'requested', null)
  },
  acceptRequest: (adminId, requesterId, group) => {
    moveMembership(requesterId, group, 'requested', 'members')
  },
  refuseRequest: (adminId, requesterId, group) => {
    moveMembership(requesterId, group, 'requested', null)
  },
  makeAdmin: (adminId, memberId, group) => {
    moveMembership(memberId, group, 'members', 'admins')
  },
  kick: (adminId, memberId, group) => {
    moveMembership(memberId, group, 'members', null)
  },
  leave: (userId, placeholder, group) => {
    const role = userIsAdmin(userId, group) ? 'admins' : 'members'
    moveMembership(userId, group, role, null)
  },
} as const

export type GroupMembershipAction = keyof typeof groupMembershipActions

export function removeUserFromGroupDoc (group, userId) {
  for (const list of groupRoles) {
    group[list] = withoutUser(group[list], userId)
  }

  // If there are no more admins, promote the 3 most senior members
  if (group.admins.length === 0) {
    const membersBySeniority = group.members.sort(byTimestamp)
    group.admins = membersBySeniority.slice(0, 3)
    group.members = membersBySeniority.slice(3)
  }

  return group
}

const byTimestamp = (a, b) => a.timestamp - b.timestamp

function withoutUser (memberships, userId) {
  return memberships.filter(memberData => memberData.user !== userId)
}

// create user's membership object that will be moved between categories
const createMembership = (userId, invitorId) => ({
  user: userId,
  invitor: invitorId,
  timestamp: Date.now(),
})

// moving membership object from previousCategory to newCategory
function moveMembership (userId, group, previousCategory, newCategory) {
  const membership = findMembership(userId, group, previousCategory, true)
  group[previousCategory] = without(group[previousCategory], membership)
  // Let the possibility to just destroy the membership
  // by letting newCategory undefined
  if (newCategory != null) group[newCategory].push(membership)
  return group
}

function findMembership (userId, group, previousCategory, wanted) {
  const membership = find(group[previousCategory], { user: userId })
  if (wanted) {
    // expect to find a membership
    if (membership != null) {
      return membership
    } else {
      const context = { userId }
      context[previousCategory] = group[previousCategory]
      throw newError('membership not found', 403, context)
    }
  } else {
    // expect to find no existing membership
    if (membership != null) {
      // return a 200 to avoid to show an error on client-side
      // while the membership does exist
      const context = { groupId: group._id, userId }
      throw newError('membership already exist', 200, context)
    }
  }
}

const userIsRole = role => (userId, group) => {
  const ids = map(group[role], 'user')
  return ids.includes(userId)
}

const userIsAdmin = userIsRole('admins')
const userIsNonAdminMember = userIsRole('members')

export const userIsGroupMember = (userId, group) => userIsAdmin(userId, group) || userIsNonAdminMember(userId, group)

export const groupCategories = {
  members: [ 'admins', 'members' ],
  users: [ 'admins', 'members', 'invited', 'requested' ],
} as const

export function getAllGroupDocMembersIds (group: Group) {
  assertObject(group)
  const adminsIds = map(group.admins, 'user')
  const membersIds = map(group.members, 'user')
  return adminsIds.concat(membersIds)
}

export const groupFormatters = {
  position: truncateLatLng,
}

export function findUserGroupMembership (userId: UserId, group: Group) {
  for (const role of groupRoles) {
    for (const membership of group[role]) {
      if (membership.user === userId) return { role, membership }
    }
  }
  return {}
}
