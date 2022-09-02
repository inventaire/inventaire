require('should')
const { authReq, authReqB, authReqC, getUserC } = require('../utils/utils')
const { getSomeGroup } = require('../fixtures/groups')
const { getGroup } = require('tests/api/utils/groups')
const { shouldNotBeCalled } = require('tests/unit/utils')
const endpoint = '/api/groups?action=decline'

describe('groups:update:decline', () => {
  it('should reject without group', async () => {
    await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject non invited users', async () => {
    const [ group, nonInvitedUser ] = await Promise.all([ getSomeGroup(), getUserC() ])
    await authReq('put', endpoint, { user: nonInvitedUser._id, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should reject invite declined by another user', async () => {
    const [ group, invitedUser ] = await Promise.all([ getSomeGroup(), getUserC() ])
    const { _id: invitedUserId } = invitedUser
    await authReq('put', '/api/groups?action=invite', { user: invitedUserId, group: group._id })
    await authReqB('put', endpoint, { user: invitedUserId, group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should remove member from invited', async () => {
    const [ group, invitedUser ] = await Promise.all([ getSomeGroup(), getUserC() ])
    const { _id: invitedUserId } = invitedUser
    await authReq('put', '/api/groups?action=invite', { user: invitedUserId, group: group._id })
    const updatedGroup = await getGroup(group)
    const declinerCount = updatedGroup.declined.length
    await authReqC('put', endpoint, { user: invitedUserId, group: updatedGroup._id })
    const reupdatedGroup = await getGroup(updatedGroup)
    reupdatedGroup.declined.length.should.equal(declinerCount + 1)
  })
})
