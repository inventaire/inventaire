import should from 'should'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from 'tests/api/utils/utils'
import { publicReq, authReqB } from '../utils/utils'
import { createListing, createElement } from '../fixtures/listings'

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
      const { list: listing } = await publicReq('get', `${endpoint}&id=${reqListing._id}`)
      listing.should.be.an.Object()
    })

    it('should not return a private listing to an authentified user', async () => {
      const { listing } = await createListing(null, { visibility: [] })
      await authReqB('get', `${endpoint}&id=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  describe('paginate:elements', () => {
    it('should return listing with a limited number of elements', async () => {
      const { listing } = await createElement({})
      await createElement({ listing })
      const { elements } = await publicReq('get', `${endpoint}&id=${listing._id}`)
      elements.length.should.be.aboveOrEqual(2)
      const { elements: elements2 } = await publicReq('get', `${endpoint}&id=${listing._id}&limit=1`)
      elements2.length.should.equal(1)
    })

    it('should take an offset parameter', async () => {
      const { uri, listing } = await createElement({})
      await createElement({ uri, listing })
      const { elements } = await publicReq('get', `${endpoint}&id=${listing._id}`)
      const offset = 1
      const { elements: elements2 } = await publicReq('get', `${endpoint}&id=${listing._id}&offset=${offset}`)
      const elementsLength = elements.length
      const elements2Length = elements2.length
      should(elementsLength - offset).equal(elements2Length)
    })
  })
})
