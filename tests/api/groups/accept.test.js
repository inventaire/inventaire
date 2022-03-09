const _ = require('builders/utils')
require('should')
const { authReq, authReqB, getUserC, getUserGetter, customAuthReq } = require('../utils/utils')
const { groupPromise, createGroup, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=accept'
const { humanName } = require('../fixtures/entities')
const { shouldNotBeCalled } = require('tests/unit/utils')

describe('groups:update:accept', () => {
  it('should reject without group', async () => {
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject non invited users', async () => {
    const [ group, user ] = await Promise.all([ groupPromise, getUserC() ])
    await authReq('put', endpoint, { user: user._id, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should reject invite accepted by another user', async () => {
    const [ group, user ] = await Promise.all([ groupPromise, getUserC() ])
    const { _id: userId } = user
    await authReq('put', '/api/groups?action=invite', { user: userId, group: group._id })
    group.members.length.should.equal(1)
    await authReqB('put', endpoint, { user: userId, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should add a member when user is accepting an invite', async () => {
    // Re-creating a group instead of using groupPromise,
    // to be isolated from other tests
    const group = await createGroup()
    const user = await getUserGetter(humanName())()
    const { _id: userId } = user
    const { _id: groupId } = group
    const memberCount = group.members.length
    await authReq('put', '/api/groups?action=invite', { user: userId, group: groupId })
    await customAuthReq(user, 'put', endpoint, { user: userId, group: groupId })
    const updatedGroup = await getGroup(group)
    updatedGroup.members.length.should.equal(memberCount + 1)
    const membersIds = _.map(updatedGroup.members, 'user')
    membersIds.should.containEql(userId)
  })
})
