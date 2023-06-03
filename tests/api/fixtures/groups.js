import { getGroupById } from '#controllers/groups/lib/groups'
import { randomWords } from '#fixtures/text'
import { getGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser, getUserB, getReservedUser } from '../utils/utils.js'

export const endpointBase = '/api/groups'

export const createGroup = (params = {}) => {
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
  })
}

export async function membershipAction (actor, action, group, user) {
  group = await group
  user = await user
  const data = { action, group: group._id }
  if (user) data.user = user._id
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

const createAndAddMember = async user => {
  const group = await createGroup()
  const [ refreshedGroup ] = await addMember(group, user)
  return refreshedGroup
}

export const createGroupAndMember = async () => {
  const member = await getReservedUser()
  const group = await createAndAddMember(member)
  return { group, member }
}

export const groupName = () => randomWords(3, ' group')
const groupDescription = () => randomWords(10)

export async function createGroupWithAMember (params) {
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
