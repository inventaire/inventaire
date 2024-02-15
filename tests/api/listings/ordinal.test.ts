import { createListingWithElements } from '../fixtures/listings.js'

describe('element:listing-ordinal', () => {
  it('should create elements with a listingId', async () => {
    const { listing } = await createListingWithElements()
    listing.elements[0].ordinal.should.equal(0)
    listing.elements[1].ordinal.should.equal(1)
  })
})
