const __ = require('config').universalPath
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createShelf, shelfName, shelfDescription } = require('../fixtures/shelves')

const endpoint = '/api/shelves?action=update'
const shelfPromise = createShelf()

describe('shelves:update', () => {
  it('should reject without shelf id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without attributes', async () => {
    const shelf = await shelfPromise
    try {
      const res = await authReq('post', endpoint, {
        id: shelf._id,
        foo: 'bar'
      })
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
      id: shelf._id,
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
        id: shelf._id,
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
