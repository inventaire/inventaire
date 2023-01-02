import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/api/utils/utils'
import { createListing, createElement } from '../fixtures/listings.js'
import { authReq, authReqB } from '../utils/utils.js'

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

  it('should return the deleted listing and delete elements', async () => {
    const elementFixture = await createElement({})
    const { listing: createdListing } = elementFixture
    const { lists: listings } = await authReq('post', endpoint, { ids: createdListing._id })
    const [ listing ] = listings
    listing._id.should.equal(createdListing._id)
    listing._deleted.should.be.true()
    listing.elements[0]._deleted.should.be.true()
  })
})
