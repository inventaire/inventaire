import { createGroupWithAMember, getSomeGroup } from '#tests/api/fixtures/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { getReservedUser } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createShelf, shelfName, shelfDescription } from '../fixtures/shelves.js'
import { authReq, authReqB, getUser } from '../utils/utils.js'

const endpoint = '/api/shelves?action=update'

describe('shelves:update', () => {
  it('should reject without shelf id', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: shelf')
      err.statusCode.should.equal(400)
    }
  })

  it('should filter out non updatable attributes', async () => {
    const { shelf } = await createShelf()
    try {
      const params = {
        shelf: shelf._id,
        foo: 'bar',
      }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject an empty name', async () => {
    const { shelf } = await createShelf()
    try {
      const params = {
        shelf: shelf._id,
        name: '',
      }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid name:')
      err.statusCode.should.equal(400)
    }
  })

  it('should update attributes', async () => {
    const name = shelfName()
    const description = shelfDescription()
    const visibility = [ 'friends', 'groups' ]
    const color = '#ffaaee'
    const { shelf } = await createShelf()
    const { shelf: updatedShelf } = await authReq('post', endpoint, {
      shelf: shelf._id,
      name,
      description,
      visibility,
      color,
    })
    updatedShelf.name.should.equal(name)
    updatedShelf.description.should.equal(description)
    updatedShelf.visibility.should.deepEqual(visibility)
    updatedShelf.color.should.equal(color)
  })

  it('should update a group-specific visibility', async () => {
    const { group, member } = await createGroupWithAMember()
    const { shelf } = await createShelf(member)
    const visibility = [ `group:${group._id}` ]
    const { shelf: updatedShelf } = await customAuthReq(member, 'post', endpoint, {
      shelf: shelf._id,
      visibility,
    })
    updatedShelf.visibility.should.deepEqual(visibility)
  })

  it("should reject the update of a shelf with a group-specific visibility from a group the user isn't a member of", async () => {
    const [ user, group ] = await Promise.all([
      getReservedUser(),
      getSomeGroup(),
    ])
    const { shelf } = await createShelf(user)
    const visibility = [ `group:${group._id}` ]
    await customAuthReq(user, 'post', endpoint, {
      shelf: shelf._id,
      visibility,
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('user is not in that group')
    })
  })

  it('should reject updating if different owner', async () => {
    try {
      const { shelf } = await createShelf()
      const params = {
        shelf: shelf._id,
        name: 'foo',
      }
      await authReqB('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(403)
    }
  })

  it('should throw when no new attribute to update', async () => {
    try {
      const { shelf } = await createShelf(getUser())
      const params = {
        shelf: shelf._id,
        name: shelf.name,
      }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should be able to remove a shelf description', async () => {
    const { shelf } = await createShelf()
    const { shelf: updatedShelf } = await authReq('post', endpoint, {
      shelf: shelf._id,
      description: null,
    })
    updatedShelf.description.should.equal('')
  })
})
