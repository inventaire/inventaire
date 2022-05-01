const { getGroup } = require('tests/api/utils/groups')
const { getUser, getUserB, customAuthReq, getReservedUser } = require('../utils/utils')
const fakeText = require('./text')
const endpointBase = '/api/groups'

const createGroup = (params = {}) => {
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

const membershipAction = async (actor, action, group, user) => {
  group = await group
  user = await user
  const data = { action, group: group._id }
  if (user) data.user = user._id
  return customAuthReq(actor, 'put', endpointBase, data)
}

const addMember = async (group, member) => {
  member = await member
  await membershipAction(member, 'request', group, member)
  await membershipAction(getUser(), 'accept-request', group, member)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, member ]
}

const addAdmin = async (group, member) => {
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

const createGroupAndMember = async () => {
  const member = await getReservedUser()
  return Promise.all([ createAndAddMember(member), member ])
}

const groupName = () => fakeText.randomWords(3, ' group')
const groupDescription = () => fakeText.randomWords(10)

const createGroupWithAMember = async params => {
  const group = await createGroup(params)
  const admin = await getUser()
  const member = await getUserB()
  const [ refreshedGroup ] = await addMember(group, member)
  return { group: refreshedGroup, admin, member }
}

let groupWithAMemberPromise
const getSomeGroupWithAMember = () => {
  groupWithAMemberPromise = groupWithAMemberPromise || createGroupWithAMember()
  return groupWithAMemberPromise
}

let groupPromise
const getSomeGroup = () => {
  // Resolves to a group with userA as admin and userB as member
  groupPromise = groupPromise || getSomeGroupWithAMember().then(({ group }) => group)
  return groupPromise
}

module.exports = {
  endpointBase,
  createGroupWithAMember,
  getSomeGroup,
  getSomeGroupWithAMember,
  groupName,
  createGroup,
  addMember,
  addAdmin,
  createGroupAndMember,
  membershipAction
}
