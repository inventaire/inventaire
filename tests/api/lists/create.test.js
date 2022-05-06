const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, customAuthReq, getReservedUser } = require('tests/api/utils/utils')
const { createGroupWithAMember, getSomeGroup } = require('tests/api/fixtures/groups')
const { authReq } = require('../utils/utils')
const { listName } = require('../fixtures/lists')
const endpoint = '/api/lists?action=create'

describe('lists:create', () => {
  it('should reject without name', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: name')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject an empty name', async () => {
    try {
      const params = { name: '' }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('invalid name: name cannot be empty')
      err.statusCode.should.equal(400)
    }
  })

  it('should default to private visibility', async () => {
    const name = listName()
    const { list } = await authReq('post', endpoint, { name })
    list.visibility.should.deepEqual([])
    list.name.should.equal(name)
  })

  describe('visibility', () => {
    it('should create a list with friends-only visibility', async () => {
      const visibility = [ 'friends' ]
      const { list } = await authReq('post', endpoint, { name: listName(), visibility })
      list.visibility.should.deepEqual(visibility)
    })

    it('should create a list with groups-only visibility', async () => {
      const visibility = [ 'groups' ]
      const { list } = await authReq('post', endpoint, { name: listName(), visibility })
      list.visibility.should.deepEqual(visibility)
    })

    it('should create a list with group-specific visibility', async () => {
      const { group, member } = await createGroupWithAMember()
      const visibility = [ `group:${group._id}` ]
      const { list } = await customAuthReq(member, 'post', endpoint, { name: listName(), visibility })
      list.visibility.should.deepEqual(visibility)
    })

    it("should reject group-specific list if user isn't a member", async () => {
      const [ user, group ] = await Promise.all([
        getReservedUser(),
        getSomeGroup(),
      ])
      const visibility = [ `group:${group._id}` ]
      await customAuthReq(user, 'post', endpoint, { name: listName(), visibility })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('user is not in that group')
      })
    })
  })
})
