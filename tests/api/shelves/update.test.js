const __ = require('config').universalPath
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB, getUser } = require('../utils/utils')
const { createShelf, shelfName, shelfDescription } = require('../fixtures/shelves')

const endpoint = '/api/shelves?action=update'
const shelfPromise = createShelf(getUser())

describe('shelves:update', () => {
  it('should reject without shelf shelf', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: shelf')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject not updatable attributes', async () => {
    const shelf = await shelfPromise
    try {
      const params = {
        shelf: shelf._id,
        foo: 'bar'
      }
      const res = await authReq('post', endpoint, params)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should update attributes', async () => {
    const name = shelfName()
    const description = shelfDescription()
    const listing = 'network'
    const shelf = await shelfPromise
    const params = {
      shelf: shelf._id,
      name,
      description,
      listing
    }
    const res = await authReq('post', endpoint, params).then(({ shelf }) => shelf)
    res.name.should.equal(name)
    res.description.should.equal(description)
    res.listing.should.equal(listing)
  })

  it('should reject updating if different owner', async () => {
    try {
      const shelf = await shelfPromise
      const params = {
        shelf: shelf._id,
        name: 'foo'
      }
      const res = await authReqB('post', endpoint, params)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(403)
    }
  })

  it('should throw when no new attribute to update', async () => {
    try {
      const shelf = await createShelf(getUser())
      const params = {
        shelf: shelf._id,
        name: shelf.name
      }
      const res = await authReq('post', endpoint, params)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('nothing to update')
      err.statusCode.should.equal(400)
    }
  })
})
