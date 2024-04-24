import 'should'
import { sentence } from '#fixtures/text'
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
      err.body.status_verbose.should.equal('invalid')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject adding a comment to an element of a listing from another creator', async () => {
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

  it('should create and update element attribute', async () => {
    const { element } = await createElement()
    const comment = sentence()
    const createdRes = await authReq('put', endpoint, {
      id: element._id,
      comment,
    })
    const comment2 = sentence()
    createdRes.comment.should.equal(comment)
    const updatedRes = await authReq('put', endpoint, {
      id: element._id,
      comment: comment2,
    })
    updatedRes.comment.should.equal(comment2)
  })
})
