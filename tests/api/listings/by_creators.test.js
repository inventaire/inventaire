const should = require('should')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, authReq, getUserB, getReservedUser } = require('../utils/utils')
const { createListing, createElement } = require('../fixtures/listings')
const { map } = require('lodash')

const endpoint = '/api/lists?action=by-creators'

describe('listings:by-creators', () => {
  it('should reject without users', async () => {
    try {
      const res = await authReq('get', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: users')
      err.statusCode.should.equal(400)
    }
  })

  it('should be empty without listings', async () => {
    const user = await getReservedUser()
    const { _id: userId } = user
    const res = await publicReq('get', `${endpoint}&users=${userId}`)
    res.lists.should.deepEqual([])
  })

  describe('visibility:overview', () => {
  // for detailed visibility validations, see tests listings/by_ids
    it('should get a public listing', async () => {
      const { listing } = await createListing()
      listing.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      const listingsIds = map(res.lists, '_id')
      listingsIds.should.containEql(listing._id)
    })

    it('should not return private lists', async () => {
      const { listing } = await createListing(getUserB(), { visibility: [] })
      const user = await getUserB()
      const res = await authReq('get', `${endpoint}&users=${user._id}`)
      const listingsIds = map(res.lists, '_id')
      listingsIds.should.not.containEql(listing._id)
    })
  })

  describe('pagination', () => {
    it('should take a limit parameter', async () => {
      const { listing } = await createListing()
      await createListing()
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      Object.values(res.lists).length.should.be.aboveOrEqual(2)
      const res2 = await publicReq('get', `${endpoint}&users=${listing.creator}&limit=1`)
      Object.values(res2.lists).length.should.equal(1)
    })

    it('should take an offset parameter', async () => {
      const { listing } = await createListing()
      await createListing()
      const offset = 1
      const { lists: listings1 } = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      const { lists: listings2 } = await publicReq('get', `${endpoint}&users=${listing.creator}&offset=${offset}`)
      const listsLength = Object.values(listings1).length
      const listings2Length = Object.values(listings2).length
      should(listsLength - offset).equal(listings2Length)
    })
  })

  describe('with-elements', () => {
    it('should get a listing without its elements by default', async () => {
      const { listing } = await createElement({})
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      should(res.lists[0].elements).not.be.ok()
    })

    it('should get a listing with its elements', async () => {
      const { listing } = await createElement({})
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}&with-elements=true`)
      res.lists[0].elements.should.be.an.Array()
    })
  })
})
