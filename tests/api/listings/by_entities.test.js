import should from 'should'
import _ from '#builders/utils'
import { someFakeUri } from '#tests/api/fixtures/entities'
import { createElement } from '../fixtures/listings.js'
import { publicReq, authReq, getUser, getUserB } from '../utils/utils.js'

const endpoint = '/api/lists?action=by-entities'

describe('listings:by-entities', () => {
  it('should be empty without listings', async () => {
    const res = await publicReq('get', `${endpoint}&uris=${someFakeUri}`)
    res.lists[someFakeUri].should.deepEqual([])
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get public listings by their elements entities uris', async () => {
      const { element, uri, listing } = await createElement({})
      listing.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      const listingsRes = res.lists[uri]
      listingsRes.should.be.ok()
      const { elements } = listingsRes[0]
      elements.should.be.ok()
      elements[0]._id.should.equal(element._id)
    })

    it('should not return private elements', async () => {
      const { uri } = await createElement({ visibility: [] }, getUserB())
      const res = await authReq('get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })
  })

  describe('pagination', () => {
    it('should take a limit parameter', async () => {
      const { uri } = await createElement({})
      await createElement({ uri })
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      Object.values(res.lists[uri]).length.should.be.aboveOrEqual(2)
      const res2 = await publicReq('get', `${endpoint}&uris=${uri}&limit=1`)
      Object.values(res2.lists[uri]).length.should.equal(1)
    })

    it('should take an offset parameter', async () => {
      const { uri } = await createElement({})
      await createElement({ uri })
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      const offset = 1
      const res2 = await publicReq('get', `${endpoint}&uris=${uri}&offset=${offset}`)
      const listingsLength = Object.values(res.lists[uri]).length
      const listings2Length = Object.values(res2.lists[uri]).length
      should(listingsLength - offset).equal(listings2Length)
    })
  })

  describe('by listings', () => {
    it('should get only requested listings', async () => {
      const { uri, listing } = await createElement({}, getUser())
      const { uri: anotherUri, listing: anotherListing } = await createElement({})
      const { lists: listings } = await authReq('get', `${endpoint}&uris=${uri}|${anotherUri}&lists=${listing._id}`)
      const listingsIds = listings[uri].map(_.property('_id'))
      listingsIds.should.containEql(listing._id)
      listingsIds.should.not.containEql(anotherListing._id)
    })
  })
})
