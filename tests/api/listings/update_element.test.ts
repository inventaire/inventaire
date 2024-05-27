import should from 'should'
import { wait } from '#lib/promises'
import { getByIdWithElements } from '#tests/api/utils/listings'
import { getUserB } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createListingWithElements } from '../fixtures/listings.js'
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
    const { element } = await createElement()
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

  it('should update ordinal and return updated element', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ elementA, elementB, elementC ] = elements
    const updatedElement = await authReq('post', endpoint, {
      id: elementC._id,
      ordinal: 1,
    })
    const updatedOrdinal = '1V'
    updatedElement.ordinal.should.equal(updatedOrdinal)
    const { elements: updatedElements } = await getByIdWithElements({ id: listing._id })
    updatedElements[0].ordinal.should.equal(elementA.ordinal)
    updatedElements[1].ordinal.should.equal(updatedOrdinal)
    updatedElements[2].ordinal.should.equal(elementB.ordinal)
  })

  it('should move element down', async () => {
    const { listing } = await createListingWithElements(null, 3)
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

  it('should move element first', async () => {
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

  it('should move element deep in the list', async () => {
    const { listing } = await createListingWithElements(null, 20)
    const { elements } = listing
    const element1 = elements[0]
    const element18 = elements[17]
    const element19 = elements[18]
    await authReq('post', endpoint, {
      id: element1._id,
      ordinal: 17,
    })
    const res = await getByIdWithElements({ id: listing._id })
    const updatedElement = res.elements.find(element => element._id === element1._id)
    should(updatedElement.ordinal > element18.ordinal).be.true()
    should(updatedElement.ordinal < element19.ordinal).be.true()
  })

  xit('should support fast edit', async () => {
    // This is an ideal test. So far, the client should do the job
    // and debounce requests accordigly to not update elements too fast
    // But clients are not able to debounce request with slow connection to the server, to do that, this test should pass
    const { listing } = await createListingWithElements(null, 20)
    const { elements } = listing
    elements.length.should.equal(20)
    const element1 = elements[0]
    const element2 = elements[1]
    const element3 = elements[2]
    const element20 = elements[19]
    await Promise.all([
      authReq('post', endpoint, { id: element1._id, ordinal: 20 }),
      wait(10).then(() => authReq('post', endpoint, { id: element2._id, ordinal: 20 })),
      wait(20).then(() => authReq('post', endpoint, { id: element3._id, ordinal: 20 })),
    ])
    const res = await getByIdWithElements({ id: listing._id })
    const updatedElement1 = res.elements.find(element => element._id === element1._id)
    const updatedElement2 = res.elements.find(element => element._id === element1._id)
    const updatedElement3 = res.elements.find(element => element._id === element1._id)
    // The generated ordinals might be the same, but they should all be above the initially last ordinal
    should(updatedElement1.ordinal > element20.ordinal).be.true()
    should(updatedElement2.ordinal > element20.ordinal).be.true()
    should(updatedElement3.ordinal > element20.ordinal).be.true()
  })
})
