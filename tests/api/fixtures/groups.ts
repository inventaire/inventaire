import { getGroupById } from '#controllers/groups/lib/groups'
import { randomWords } from '#fixtures/text'
import { createUser, type AwaitableUserWithCookie } from '#fixtures/users'
import type { GroupCreationParams } from '#models/group'
import { getGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser, getUserB, type Awaitable } from '#tests/api/utils/utils'
import type { Group } from '#types/group'

export const endpointBase = '/api/groups'

type CreateGroupParams = Partial<GroupCreationParams> & { user?: AwaitableUserWithCookie }
export const createGroup = (params: CreateGroupParams = {}) => {
  const {
    name = groupName(),
    description = groupDescription(),
    user = getUser(),
    position = [ 1, 1 ],
    searchable = true,
    open = false,
  } = params
  return customAuthReq(user, 'post', `${endpointBase}?action=create`, {
    name,
    description,
    position,
    searchable,
    open,
  }) as Promise<Group>
}

type AwaitableGroup = Awaitable<Group>

export async function membershipAction (actor: AwaitableUserWithCookie, action: string, group: AwaitableGroup, user?: AwaitableUserWithCookie) {
  group = await group
  user = await user
  const data = {
    action,
    group: group._id,
    user: user ? user._id : undefined,
  }
  return customAuthReq(actor, 'put', endpointBase, data)
}

export async function addMember (group, member) {
  member = await member
  await membershipAction(member, 'request', group, member)
  await membershipAction(getUser(), 'accept-request', group, member)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, member ]
}

export async function addAdmin (group, member) {
  await addMember(group, member)
  await membershipAction(getUser(), 'make-admin', group, member)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, member ]
}

export async function addInvited (group, invited) {
  await membershipAction(getUser(), 'invite', group, invited)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, invited ]
}

export async function addRequested (group, requester) {
  await membershipAction(requester, 'request', group)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, requester ]
}

export async function addDeclined (group, declined) {
  await addInvited(group, declined)
  await membershipAction(declined, 'decline', group)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, declined ]
}

const createAndAddMember = async user => {
  const group = await createGroup()
  const [ refreshedGroup ] = await addMember(group, user)
  return refreshedGroup
}

export const createGroupAndMember = async () => {
  const member = await createUser()
  const group = await createAndAddMember(member)
  return { group, member }
}

export const groupName = () => randomWords(3, ' group')
const groupDescription = () => randomWords(10)

export async function createGroupWithAMember (params?: CreateGroupParams) {
  const group = await createGroup(params)
  const admin = await getUser()
  const member = await getUserB()
  const [ refreshedGroup ] = await addMember(group, member)
  return { group: refreshedGroup, admin, member }
}

let groupWithAMemberPromise
export const getSomeGroupWithAMember = () => {
  groupWithAMemberPromise = groupWithAMemberPromise || createGroupWithAMember()
  return groupWithAMemberPromise
}

let groupPromise
export async function getSomeGroup () {
  // Resolves to a group with userA as admin and userB as member
  groupPromise = groupPromise || getSomeGroupWithAMember().then(({ group }) => group)
  const group = await groupPromise
  // Get fresh data
  return getGroupById(group._id)
}
