const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createListing, createSelection } = require('../fixtures/listings')

const endpoint = '/api/lists?action=delete'

describe('listings:delete', () => {
  it('should reject without listings ids', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject deleting different user listing', async () => {
    try {
      const { listing } = await createListing()
      await authReqB('post', endpoint, { ids: listing._id }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong user')
      err.statusCode.should.equal(403)
    }
  })

  it('should return the deleted listing and delete selections', async () => {
    const selectionFixture = await createSelection({})
    const { listing: createdListing } = selectionFixture
    const { lists: listings } = await authReq('post', endpoint, { ids: createdListing._id })
    const [ listing ] = listings
    listing._id.should.equal(createdListing._id)
    listing._deleted.should.be.true()
    listing.selections[0]._deleted.should.be.true()
  })
})
