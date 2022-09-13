const should = require('should')
const { publicReq, authReq, getUserB } = require('../utils/utils')
const { createSelection } = require('../fixtures/listings')
const { someFakeUri } = require('tests/api/fixtures/entities')

const endpoint = '/api/lists?action=by-entities'

describe('listings:by-entities', () => {
  it('should be empty without listings', async () => {
    const res = await publicReq('get', `${endpoint}&uris=${someFakeUri}`)
    res.lists[someFakeUri].should.deepEqual([])
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get public listings by their selections entities uris', async () => {
      const { selection, uri, listing } = await createSelection({})
      listing.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      const listingsRes = res.lists[uri]
      listingsRes.should.be.ok()
      const { selections } = listingsRes[0]
      selections.should.be.ok()
      selections[0]._id.should.equal(selection._id)
    })

    it('should not return private selections', async () => {
      const { uri } = await createSelection({ visibility: [] }, getUserB())
      const res = await authReq('get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })
  })

  describe('pagination', () => {
    it('should take a limit parameter', async () => {
      const { uri } = await createSelection({})
      await createSelection({ uri })
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      Object.values(res.lists[uri]).length.should.be.aboveOrEqual(2)
      const res2 = await publicReq('get', `${endpoint}&uris=${uri}&limit=1`)
      Object.values(res2.lists[uri]).length.should.equal(1)
    })

    it('should take an offset parameter', async () => {
      const { uri } = await createSelection({})
      await createSelection({ uri })
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      const offset = 1
      const res2 = await publicReq('get', `${endpoint}&uris=${uri}&offset=${offset}`)
      const listingsLength = Object.values(res.lists[uri]).length
      const listings2Length = Object.values(res2.lists[uri]).length
      should(listingsLength - offset).equal(listings2Length)
    })
  })
})
