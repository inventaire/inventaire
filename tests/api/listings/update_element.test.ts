import 'should'
import { getListingById } from '#tests/api/utils/listings'
import { getUserB } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createListingWithElements, createElement, createElement } from '../fixtures/listings.js'
import { authReq } from '../utils/utils.js'

const endpoint = '/api/lists?action=update-element'

async function createElement () {
  const { listing } = await createListingWithElements()
  return {
    element: listing.elements[0],
    listing,
  }
}

describe('element:update', () => {
  it('should reject without element id', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject invalid attribute element', async () => {
    try {
      const { element } = await createElement()
      await authReq('post', endpoint, {
        id: element._id,
        whatever: '',
      })
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject updating an element of a listing from another creator', async () => {
    try {
      const { listing } = await createListingWithElements(getUserB())
      const element = listing.elements[0]
      await authReq('post', endpoint, {
        id: element._id,
        ordinal: 0,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong user')
      err.statusCode.should.equal(403)
    }
  })
})

describe('element:update:ordinal', () => {
  it('should not update same ordinal', async () => {
    const { element } = await createElement({})
    try {
      await authReq('post', endpoint, {
        id: element._id,
        ordinal: element.ordinal,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should update ordinal', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ firstElement, secondElement ] = elements
    await authReq('post', endpoint, {
      id: secondElement._id,
      ordinal: firstElement.ordinal,
    })
    await getListingById({ id: listing._id })
  })
})
