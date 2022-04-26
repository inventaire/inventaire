const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq, authReqB, getUser } = require('../utils/utils')
const { createShelf, shelfName, shelfDescription } = require('../fixtures/shelves')

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
        foo: 'bar'
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
        name: ''
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
    const listing = 'network'
    const color = '#ffaaee'
    const { shelf } = await createShelf()
    const { shelf: updatedShelf } = await authReq('post', endpoint, {
      shelf: shelf._id,
      name,
      description,
      listing,
      color,
    })
    updatedShelf.name.should.equal(name)
    updatedShelf.description.should.equal(description)
    updatedShelf.listing.should.equal(listing)
    updatedShelf.color.should.equal(color)
  })

  it('should reject updating if different owner', async () => {
    try {
      const { shelf } = await createShelf()
      const params = {
        shelf: shelf._id,
        name: 'foo'
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
        name: shelf.name
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
