import { createWork } from '#fixtures/entities'
import { createListing, createElement } from '#fixtures/listings'
import { federatedMode } from '#server/config'
import { getByUri, merge, revertMerge } from '#tests/api/utils/entities'
import { getListingById } from '#tests/api/utils/listings'
import { publicReq, getUserB } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const endpoint = '/api/lists?action=by-id'

describe('listings:by-id', () => {
  it('should reject without id', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: id')
      err.statusCode.should.equal(400)
    }
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get a public listing', async () => {
      const { listing: reqListing } = await createListing()
      const listing = await getListingById({ id: reqListing._id })
      listing.should.be.an.Object()
    })

    it('should not return a private listing to an authentified user', async () => {
      const { listing } = await createListing(null, { visibility: [] })
      return getListingById({ user: getUserB(), id: listing._id })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  describe('redirects hook', () => {
    it('should update element uri after merging entities', async () => {
      const work = await createWork()
      const { uri, listing } = await createElement({})
      await merge(uri, work.uri)
      // Trigger the merge propagation
      if (federatedMode) await getByUri(uri)
      const { list } = await publicReq('get', `${endpoint}&id=${listing._id}`)
      list.elements[0].uri.should.equal(work.uri)
    })

    it('should revert element uri after an entity merge was reverted', async () => {
      const work = await createWork()
      const { uri, listing } = await createElement({})
      await merge(uri, work.uri)
      // Trigger the merge propagation and subscription to the revert merge event
      if (federatedMode) await getByUri(uri)
      await revertMerge(uri)
      const { list } = await publicReq('get', `${endpoint}&id=${listing._id}`)
      list.elements[0].uri.should.equal(uri)
    })
  })
})
