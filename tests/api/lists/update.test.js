const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, customAuthReq, getReservedUser } = require('tests/api/utils/utils')
const { authReq, authReqB, getUser } = require('../utils/utils')
const { createList, listName, listDescription } = require('../fixtures/lists')
const { createGroupWithAMember, getSomeGroup } = require('tests/api/fixtures/groups')
const { someCouchUuid } = require('tests/api/fixtures/general')

const endpoint = '/api/lists'

describe('lists:update', () => {
  it('should reject without list id', async () => {
    try {
      await authReq('put', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should filter out non updatable attributes', async () => {
    const { list } = await createList()
    try {
      const params = {
        id: list._id,
        foo: 'bar'
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject an empty name', async () => {
    const { list } = await createList()
    try {
      const params = {
        id: list._id,
        name: ''
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid name:')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject when list is not found', async () => {
    try {
      const params = {
        id: someCouchUuid,
        name: ''
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('not_found:')
      err.statusCode.should.equal(404)
    }
  })

  it('should update attributes', async () => {
    const name = listName()
    const description = listDescription()
    const visibility = [ 'network' ]
    const { list } = await createList()
    const { list: updatedList } = await authReq('put', endpoint, {
      id: list._id,
      name,
      description,
      visibility,
    })
    updatedList.name.should.equal(name)
    updatedList.description.should.equal(description)
    updatedList.visibility.should.deepEqual(visibility)
  })

  it('should update a group-specific visibility', async () => {
    const { group, member } = await createGroupWithAMember()
    const { list } = await createList(member)
    const visibility = [ `group:${group._id}` ]
    const { list: updatedList } = await customAuthReq(member, 'put', endpoint, {
      id: list._id,
      visibility,
    })
    updatedList.visibility.should.deepEqual(visibility)
  })

  it("should reject the update of a list with a group-specific visibility from a group the user isn't a member of", async () => {
    const [ user, group ] = await Promise.all([
      getReservedUser(),
      getSomeGroup(),
    ])
    const { list } = await createList(user)
    const visibility = [ `group:${group._id}` ]
    await customAuthReq(user, 'put', endpoint, {
      id: list._id,
      visibility,
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('user is not in that group')
    })
  })

  it('should reject updating if different user', async () => {
    try {
      const { list } = await createList()
      const params = {
        id: list._id,
        name: 'foo'
      }
      await authReqB('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong user')
      err.statusCode.should.equal(403)
    }
  })

  it('should throw when no new attribute to update', async () => {
    try {
      const { list } = await createList(getUser())
      const params = {
        id: list._id,
        name: list.name
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should be able to remove a list description', async () => {
    const { list } = await createList()
    const { list: updatedList } = await authReq('put', endpoint, {
      id: list._id,
      description: null,
    })
    updatedList.description.should.equal('')
  })
})
