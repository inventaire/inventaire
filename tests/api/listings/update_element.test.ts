import should from 'should'
import { createListing } from '#fixtures/listings'
import { sentence } from '#fixtures/text'
import { wait } from '#lib/promises'
import { createElement, createListingWithElements } from '#tests/api/fixtures/listings'
import { getListingById, addElements, getByIdWithElements } from '#tests/api/utils/listings'
import { getUser, getUserB, authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const endpoint = '/api/lists?action=update-element'

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
        comment: sentence(),
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong user')
      err.statusCode.should.equal(403)
    }
  })
})

it('should create and update element attribute', async () => {
  const { element } = await createElement()
  const comment = sentence()
  const createdRes = await authReq('post', endpoint, {
    id: element._id,
    comment,
  })
  const comment2 = sentence()
  createdRes.comment.should.equal(comment)
  const updatedRes = await authReq('post', endpoint, {
    id: element._id,
    comment: comment2,
  })
  updatedRes.comment.should.equal(comment2)
})

it('should be able to remove a comment', async () => {
  const { listing, element } = await createElement()
  const comment = sentence()
  await authReq('post', endpoint, {
    id: element._id,
    comment,
  })
  const updatedElementListing = await getListingById({ user: getUserB(), id: listing._id })
  updatedElementListing.elements[0].comment.should.equal(comment)
  await authReq('post', endpoint, {
    id: element._id,
    comment: null,
  })
  const updatedElementListing2 = await getListingById({ user: getUserB(), id: listing._id })
  updatedElementListing2.elements[0].comment.should.equal('')
})

describe('element:update:list', () => {
  it('should update attribute with the recipient listing id', async () => {
    const { listing } = await createListing()
    const { listing: elementListing } = await createListingWithElements()
    const { elements } = elementListing
    const element = elements[0]
    await authReq('post', endpoint, {
      id: element._id,
      list: listing._id,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(element._id)
  })

  it('should reject when the recipient listing belong to another owner', async () => {
    try {
      const { listing } = await createListing(getUserB())
      const { listing: elementListing } = await createListingWithElements()
      const { elements } = elementListing
      const element = elements[0]
      await authReq('post', endpoint, {
        id: element._id,
        list: listing._id,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong user')
      err.statusCode.should.equal(403)
    }
  })

  it("should reject when the recipient listing is already the element's one", async () => {
    try {
      const { listing: elementListing } = await createListingWithElements()
      const { elements } = elementListing
      const element = elements[0]
      await authReq('post', endpoint, {
        id: element._id,
        list: elementListing._id,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('element already belongs to the list')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject when the element uri is already part of the recipient listing', async () => {
    try {
      const { listing } = await createListingWithElements()
      const element = listing.elements[0]
      const { listing: recipientListing } = await createListing()
      await addElements(getUser(), {
        id: recipientListing._id,
        uris: [ element.uri ],
      })
      await authReq('post', endpoint, {
        id: element._id,
        list: recipientListing._id,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('element is already in the list')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject when the recipient listing type and the entity type do not match', async () => {
    try {
      const { listing } = await createListingWithElements()
      const element = listing.elements[0]
      const { listing: recipientListing } = await createListing(null, { type: 'author' })
      await addElements(getUser(), {
        id: recipientListing._id,
        uris: [ element.uri ],
      })
      await authReq('post', endpoint, {
        id: element._id,
        list: recipientListing._id,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('cannot add this entity type to this list')
      err.statusCode.should.equal(403)
    }
  })

  it('should update ordinal to the last position of the recipient listing elements', async () => {
    const elementsLength = 4
    const { listing: elementListing } = await createListingWithElements()
    const { listing: recipientListing } = await createListingWithElements(null, elementsLength)
    const { elements } = elementListing
    const element = elements[0]
    await authReq('post', endpoint, {
      id: element._id,
      list: recipientListing._id,
    })
    const res = await getByIdWithElements({ id: recipientListing._id })
    res.elements[elementsLength]._id.should.equal(element._id)
  })
})

describe('element:update:ordinal', () => {
  it('should not update same ordinal', async () => {
    const { element } = await createElement()
    try {
      await authReq('post', endpoint, {
        id: element._id,
        ordinal: 1,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should update element ordinal to the last position when requested ordinal is above listing elements size', async () => {
    const elementsLength = 4
    const { listing } = await createListingWithElements(null, elementsLength)
    const { elements } = listing
    const element = elements[0]
    await authReq('post', endpoint, {
      id: element._id,
      ordinal: elementsLength + 2,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[elementsLength - 1]._id.should.equal(element._id)
  })

  it('should update ordinal and return updated element', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ elementA, elementB, elementC ] = elements
    const updatedElement = await authReq('post', endpoint, {
      id: elementC._id,
      ordinal: 2,
    })
    updatedElement.ordinal.should.be.above(elementA.ordinal)
    updatedElement.ordinal.should.be.below(elementB.ordinal)
  })

  it('should move element down', async () => {
    const { listing } = await createListingWithElements(null, 3)
    const { elements } = listing
    const [ elementA, elementB ] = elements
    await authReq('post', endpoint, {
      id: elementA._id,
      ordinal: 2,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(elementB._id)
    res.elements[1]._id.should.equal(elementA._id)
  })

  it('should move element down then precedent element down again', async () => {
    const { listing } = await createListingWithElements(null, 2)
    const { elements } = listing
    const [ elementA, elementB ] = elements
    await authReq('post', endpoint, {
      id: elementA._id,
      ordinal: 2,
    })
    await getByIdWithElements({ id: listing._id })
    await wait(10)
    await authReq('post', endpoint, {
      id: elementB._id,
      ordinal: 2,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(elementA._id)
    res.elements[1]._id.should.equal(elementB._id)
  })

  it('should move element up', async () => {
    const { listing } = await createListingWithElements()
    const { elements } = listing
    const [ elementA, elementB, elementC ] = elements
    await authReq('post', endpoint, {
      id: elementC._id,
      ordinal: 2,
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
      ordinal: 1,
    })
    const res = await getByIdWithElements({ id: listing._id })
    res.elements[0]._id.should.equal(elementC._id)
    res.elements[1]._id.should.equal(elementA._id)
    res.elements[2]._id.should.equal(elementB._id)
  })

  xit('should move element deep in the list', async () => {
    const { listing } = await createListingWithElements(null, 20)
    const { elements } = listing
    const element1 = elements[0]
    const element18 = elements[17]
    const element19 = elements[18]
    await authReq('post', endpoint, {
      id: element1._id,
      ordinal: 18,
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
