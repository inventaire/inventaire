import { map } from 'lodash-es'
import { getByIdWithElements } from '#tests/api/utils/listings'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createListing, createListingWithElements, createElement, removeElement } from '../fixtures/listings.js'
import { authReq } from '../utils/utils.js'

const endpoint = '/api/lists?action='
const reorder = `${endpoint}reorder`

describe('element:listing-ordinal', () => {
  it('should create elements with a listingId', async () => {
    const { listing } = await createListingWithElements()
    listing.elements[0].ordinal.should.equal(0)
    listing.elements[1].ordinal.should.equal(1)
  })

  it('should reject without elements to reorder', async () => {
    const { listing } = await createListingWithElements()
    try {
      await authReq('post', reorder, { id: listing._id })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject listing without elements', async () => {
    const { listing } = await createListing()
    const { element } = await createElement({})
    try {
      await authReq('post', reorder, {
        id: listing._id,
        uris: [ element.uri ],
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('no elements to reorder')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject with elements not belonging to a listing', async () => {
    const { listing } = await createListingWithElements()
    const { element } = await createElement({})
    try {
      await authReq('post', reorder, {
        id: listing._id,
        uris: [ element.uri ],
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('some elements are not in the list')
      err.statusCode.should.equal(400)
    }
  })

  it('should reorder elements', async () => {
    const { listing } = await createListingWithElements()
    const [ uri1, uri2 ] = map(listing.elements, 'uri')
    await authReq('post', reorder, {
      id: listing._id,
      uris: [ uri2, uri1 ],
    })
    const resListing = await getByIdWithElements({ id: listing._id })
    resListing.elements[0].uri.should.equal(uri2)
    resListing.elements[1].ordinal.should.equal(1)
  })

  it('should assign new ordinal if one element has been removed', async () => {
    const { listing, uris } = await createListingWithElements()
    const [ uri1, uri2 ] = uris
    const { uri: uri3 } = await createElement({ listing })
    await removeElement({ uri: uri2, listing })

    const resListing = await getByIdWithElements({ id: listing._id })
    resListing.elements[1].uri.should.equal(uri3)
    resListing.elements[1].ordinal.should.equal(2)

    await authReq('post', reorder, {
      id: listing._id,
      uris: [ uri1, uri3 ],
    })
    const resListing2 = await getByIdWithElements({ id: listing._id })
    resListing2.elements[1].uri.should.equal(uri3)
    resListing2.elements[1].ordinal.should.equal(1)
  })
})
