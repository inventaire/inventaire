const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
const { authReq, authReqB, getUser, getUserB, customAuthReq, getUserGetter } = require('../utils/utils')
const faker = require('faker')
const endpointBase = '/api/groups'
const endpointAction = `${endpointBase}?action`
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

const getGroup = groupId => {
  assert_.string(groupId)
  return authReq('get', `${endpointAction}=by-id&id=${groupId}`)
  .get('group')
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

const membershipAction = (actor, action, groupId, userId) => {
  return customAuthReq(actor, 'put', endpointBase, { action, group: groupId, user: userId })
}

const addMember = async (groupPromise, memberPromise) => {
  const [ group, member ] = await Promise.all([ groupPromise, memberPromise ])
  const { _id: memberId } = member
  await membershipAction(member, 'request', group._id, memberId)
  await membershipAction(getUser(), 'accept-request', group._id, memberId)
  const refreshedGroup = await getGroup(group._id)
  return [ refreshedGroup, member ]
}

const createAndAddMember = async memberPromise => {
  const member = await Promise.resolve(memberPromise)
  const group = await createGroup()
  const [ refreshedGroup ] = await addMember(group, member)
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
    return membershipAction(getUserB(), 'request', group._id)
    .then(() => getUserB())
    .then(userB => membershipAction(getUser(), 'accept-request', group._id, userB._id))
    .then(() => getGroup(group._id))
  })

module.exports = { endpointBase, groupPromise, getGroup, groupName, createGroup, addMember, groupAndMemberPromise }
