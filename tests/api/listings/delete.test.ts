import { createListing, createElement } from '#fixtures/listings'
import { authReq, authReqB } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

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

  it('should return the deleted listing and deleted elements', async () => {
    const { listing } = await createElement({})
    const { lists: resListings, elements } = await authReq('post', endpoint, { ids: listing._id })
    const resListing = resListings[0]
    resListing._id.should.equal(listing._id)
    resListing._deleted.should.be.true()
    elements[0]._deleted.should.be.true()
  })
})
