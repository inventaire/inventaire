import { createWork } from '#fixtures/entities'
import { createElement } from '#fixtures/listings'
import { federatedMode } from '#server/config'
import { getByUri, merge, revertMerge } from '#tests/api/utils/entities'
import { getListingById } from '#tests/api/utils/listings'

describe('listings:entity changes', () => {
  it('should update element uri after merging entities', async () => {
    const work = await createWork()
    const { uri, listing } = await createElement({})
    await merge(uri, work.uri)
    // Trigger the merge propagation
    if (federatedMode) await getByUri(uri)
    const updatedListing = await getListingById({ id: listing._id })
    updatedListing.elements[0].uri.should.equal(work.uri)
  })

  it('should revert element uri after an entity merge was reverted', async () => {
    const work = await createWork()
    const { uri, listing } = await createElement({})
    await merge(uri, work.uri)
    // Trigger the merge propagation and subscription to the revert merge event
    if (federatedMode) await getByUri(uri)
    await revertMerge(uri)
    const updatedListing = await getListingById({ id: listing._id })
    updatedListing.elements[0].uri.should.equal(uri)
  })
})
