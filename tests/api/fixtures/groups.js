const { authReq, getUser, getUserB, customAuthReq, getUserGetter } = require('../utils/utils')
const faker = require('faker')
const endpointBase = '/api/groups'
const endpointAction = `${endpointBase}?action`
const { humanName } = require('../fixtures/entities')

const getGroup = async group => {
  group = await group
  const { group: refreshedGroup } = await authReq('get', `${endpointAction}=by-id&id=${group._id}`)
  return refreshedGroup
}

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

const groupAndMemberPromise = () => {
  const memberPromise = getUserGetter(humanName())()
  return [ createAndAddMember(memberPromise), memberPromise ]
}

const groupName = () => `${faker.lorem.words(3)} group`
const groupDescription = () => faker.lorem.words(10)

const createGroupWithAMember = async params => {
  const group = await createGroup(params)
  const admin = await getUser()
  const member = await getUserB()
  const [ refreshedGroup ] = await addMember(group, member)
  return { group: refreshedGroup, admin, member }
}

// Resolves to a group with userA as admin and userB as member
const groupPromise = createGroupWithAMember().then(({ group }) => group)

module.exports = {
  endpointBase,
  groupPromise,
  getGroup,
  createGroupWithAMember,
  groupName,
  createGroup,
  addMember,
  addAdmin,
  groupAndMemberPromise,
  membershipAction
}
