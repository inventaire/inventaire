// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const { authReq, authReqB, getUserB } = require('../utils/utils')
const faker = require('faker')
const endpointBase = '/api/groups'
const endpointAction = `${endpointBase}?action`

const getGroup = groupId => authReq('get', `${endpointAction}=by-id&id=${groupId}`)
.get('group')

const createGroup = name => authReq('post', `${endpointBase}?action=create`, {
  name,
  position: [ 1, 1 ],
  searchable: true
})

const membershipAction = (reqFn, action, groupId, userId) => reqFn('put', endpointBase, { action, group: groupId, user: userId })

const groupName = () => `${faker.lorem.word()} group`

// Resolves to a group with userA as admin and userB as member
const groupPromise = createGroup(groupName())
  .then(group => membershipAction(authReqB, 'request', group._id)
.then(() => getUserB())
.then(userB => membershipAction(authReq, 'accept-request', group._id, userB._id)).then(() => getGroup(group._id)))

module.exports = { endpointBase, endpointAction, groupPromise, getGroup, groupName }
