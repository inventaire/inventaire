require('should')
const { customAuthReq, authReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { groupPromise, getGroup, createGroup } = require('../fixtures/groups')
const { createUser } = require('../fixtures/users')
const endpoint = '/api/groups?action=request'

describe('groups:update:request', () => {
  it('should reject without group', async () => {
    try {
      await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject request from already member users', async () => {
    try {
      const group = await groupPromise
      const userPromise = createUser()
      await customAuthReq(userPromise, 'put', endpoint, { group: group._id })
      await customAuthReq(userPromise, 'put', endpoint, { group: group._id }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('user is already in group')
      err.statusCode.should.equal(403)
    }
  })

  it('should add user to requesters list', async () => {
    const group = await createGroup()
    const userPromise = createUser()
    const requestCount = group.invited.length
    await customAuthReq(userPromise, 'put', endpoint, { group: group._id })
    const resGroup = await getGroup(group)
    resGroup.requested.length.should.equal(requestCount + 1)
  })

  describe('when group is open', () => {
    it('should directly add user to members', async () => {
      const group = await createGroup()
      await authReq('put', '/api/groups?action=update-settings', {
        group: group._id,
        attribute: 'open',
        value: true
      })
      const membersCount = group.members.length
      const requestedCount = group.requested.length
      const userPromise = createUser()
      await customAuthReq(userPromise, 'put', endpoint, { group: group._id })
      const resGroup = await getGroup(group)
      resGroup.members.length.should.equal(membersCount + 1)
      resGroup.requested.length.should.equal(requestedCount)
    })
  })
})
