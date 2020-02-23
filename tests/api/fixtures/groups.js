const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
const { authReq, getUser, getUserB, customAuthReq, getUserGetter } = require('../utils/utils')
const faker = require('faker')
const endpointBase = '/api/groups'
const endpointAction = `${endpointBase}?action`
const { humanName } = require('../fixtures/entities')

const getGroup = async group => {
  group = await Promise.resolve(group)
  const { group: refreshedGroup } = await authReq('get', `${endpointAction}=by-id&id=${group._id}`)
  return refreshedGroup
}

const createGroup = (params = {}) => {
  const name = params.name || groupName()
  const user = params.user || getUser()
  return customAuthReq(user, 'post', `${endpointBase}?action=create`, {
    name,
    position: [ 1, 1 ],
    searchable: true
  })
}

const membershipAction = async (actor, action, group, user) => {
  group = await Promise.resolve(group)
  user = await Promise.resolve(user)
  const data = { action, group: group._id }
  if (user) data.user = user._id
  return customAuthReq(actor, 'put', endpointBase, data)
}

const addMember = async ({ group, admin, user }) => {
  group = await Promise.resolve(group)
  admin = admin || getUser()
  admin = await Promise.resolve(admin)
  user = await Promise.resolve(user)
  assert_.object(group)
  assert_.object(admin)
  assert_.object(user)
  await membershipAction(user, 'request', group, user)
  await membershipAction(admin, 'accept-request', group, user)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, user ]
}

const addAdmin = async (group, member) => {
  await addMember({ group, member })
  await membershipAction(getUser(), 'make-admin', group, member)
  const refreshedGroup = await getGroup(group)
  return [ refreshedGroup, member ]
}

const createAndAddMember = async user => {
  const group = await createGroup()
  const [ refreshedGroup ] = await addMember({ group, user })
  return refreshedGroup
}

const groupAndMemberPromise = () => {
  const memberPromise = getUserGetter(humanName(), false)()
  return [ createAndAddMember(memberPromise), memberPromise ]
}

const groupName = () => `${faker.lorem.words(3)} group`

// Resolves to a group with userA as admin and userB as member
const groupPromise = createGroup()
  .then(group => {
    return membershipAction(getUserB(), 'request', group)
    .then(() => getUserB())
    .then(userB => membershipAction(getUser(), 'accept-request', group, userB))
    .then(() => getGroup(group))
  })

module.exports = { endpointBase, groupPromise, getGroup, groupName, createGroup, addMember, addAdmin, groupAndMemberPromise }
