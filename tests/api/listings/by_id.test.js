const should = require('should')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, authReqB } = require('../utils/utils')
const { createListing, createSelection } = require('../fixtures/listings')

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

  describe('paginate:selections', () => {
    it('should return listing with a limited number of selections', async () => {
      const { uri, listing } = await createSelection({})
      await createSelection({ uri, listing })
      const { selections } = await publicReq('get', `${endpoint}&id=${listing._id}`)
      selections.length.should.be.aboveOrEqual(2)
      const { selections: selections2 } = await publicReq('get', `${endpoint}&id=${listing._id}&limit=1`)
      selections2.length.should.equal(1)
    })

    it('should take an offset parameter', async () => {
      const { uri, listing } = await createSelection({})
      await createSelection({ uri, listing })
      const { selections } = await publicReq('get', `${endpoint}&id=${listing._id}`)
      const offset = 1
      const { selections: selections2 } = await publicReq('get', `${endpoint}&id=${listing._id}&offset=${offset}`)
      const selectionsLength = selections.length
      const selections2Length = selections2.length
      should(selectionsLength - offset).equal(selections2Length)
    })
  })
})
