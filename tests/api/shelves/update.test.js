const __ = require('config').universalPath
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB, getUser } = require('../utils/utils')
const { createShelf, shelfName, shelfDescription } = require('../fixtures/shelves')

const endpoint = '/api/shelves?action=update'
const shelfPromise = createShelf(getUser())

describe('shelves:update', () => {
  it('should reject without shelf shelf', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
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
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
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
    const res = await authReq('post', endpoint, params).get('shelf')
    res.name.should.equal(name)
    res.description.should.equal(description)
    res.listing.should.equal(listing)
  })

  it('should reject updating if different owner', async () => {
    try {
      const shelf = await shelfPromise
      const res = await authReqB('post', endpoint, {
        shelf: shelf._id,
        name: 'foo'
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })
})
