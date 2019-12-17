const CONFIG = require('config')
const __ = CONFIG.universalPath
const { authReq, authReqB, getUserB, customAuthReq, getUserGetter } = require('../utils/utils')
const faker = require('faker')
const endpointBase = '/api/groups'
const endpointAction = `${endpointBase}?action`
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

const getGroup = groupId => {
  return authReq('get', `${endpointAction}=by-id&id=${groupId}`)
  .get('group')
}

const createGroup = name => {
  name = name || groupName()
  return authReq('post', `${endpointBase}?action=create`, {
    name,
    position: [ 1, 1 ],
    searchable: true
  })
}

const membershipAction = (reqFn, action, groupId, userId) => {
  return reqFn('put', endpointBase, { action, group: groupId, user: userId })
}

const addMember = (groupPromise, memberPromise) => {
  return Promise.all([ groupPromise, memberPromise ])
  .spread((group, member) => {
    const { _id: memberId } = member
    return customAuthReq(memberPromise, 'put', '/api/groups?action=request', { group: group._id })
    .then(() => {
      return membershipAction(authReq, 'accept-request', group._id, memberId)
      .then(() => {
        return Promise.all([ getGroup(group._id), memberPromise ])
      })
    })
  })
}

const createAndAddMember = memberPromise => {
  return createGroup()
  .then(group => {
    return customAuthReq(memberPromise, 'put', '/api/groups?action=request', { group: group._id })
    .then(() => {
      return Promise.resolve(memberPromise)
      .then(member => {
        return membershipAction(authReq, 'accept-request', group._id, member._id)
        .then(() => {
          return getGroup(group._id)
        })
      })
    })
  })
}

const groupAndMemberPromise = () => {
  const memberPromise = getUserGetter(humanName(), false)()
  return [ createAndAddMember(memberPromise), memberPromise ]
}

const groupName = () => `${faker.lorem.words(3)} group`

// Resolves to a group with userA as admin and userB as member
const groupPromise = createGroup()
  .then(group => {
    return membershipAction(authReqB, 'request', group._id)
    .then(() => getUserB())
    .then(userB => membershipAction(authReq, 'accept-request', group._id, userB._id))
    .then(() => getGroup(group._id))
  })

module.exports = { endpointBase, groupPromise, getGroup, groupName, createGroup, addMember, groupAndMemberPromise }
