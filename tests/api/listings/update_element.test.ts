import 'should'
import { getListingById,getByIdWithElements } from '#tests/api/utils/listings'
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
        ordinal: 0,
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
    const [ elementA, elementB, elementC ] = elements
    await authReq('post', endpoint, {
      id: elementC._id,
      ordinal: 1,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0].ordinal.should.equal(elementA.ordinal)
    res.elements[1].ordinal.should.equal('1V')
    res.elements[2].ordinal.should.equal(elementB.ordinal)
  })

  it('should move element down', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ elementA, elementB ] = elements
    await authReq('post', endpoint, {
      id: elementA._id,
      ordinal: 1,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(elementB._id)
    res.elements[1]._id.should.equal(elementA._id)
  })

  it('should move element up', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ elementA, elementB, elementC ] = elements
    await authReq('post', endpoint, {
      id: elementC._id,
      ordinal: 1,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(elementA._id)
    res.elements[1]._id.should.equal(elementC._id)
    res.elements[2]._id.should.equal(elementB._id)
  })

  it('should move element as first in list', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ elementA, elementB, elementC ] = elements
    await authReq('post', endpoint, {
      id: elementC._id,
      ordinal: 0,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(elementC._id)
    res.elements[1]._id.should.equal(elementA._id)
    res.elements[2]._id.should.equal(elementB._id)
  })
})
