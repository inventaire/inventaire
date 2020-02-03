const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getUserB, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')

const endpoint = '/api/shelves?action=add-items'
const shelfPromise = createShelf()

describe('shelves:add-items', () => {
  it('should reject without shelf id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without items', async () => {
    const shelf = await shelfPromise
    try {
      const res = await authReq('post', endpoint, {
        id: shelf._id
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: items')
      err.statusCode.should.equal(400)
    }
  })

  it('should add items', async () => {
    const shelf = await shelfPromise
    const item = await createItem()
    const { _id: id } = item
    const res = await authReq('post', endpoint, {
      id: shelf._id,
      items: id // should be tolerant to single id
    })
    res.shelves.should.be.ok()
    const firstShelf = _.values(res.shelves)[0]
    firstShelf.items.should.be.an.Array()
    firstShelf.items.length.should.be.above(0)
    firstShelf.items[0].should.equal(id)
  })

  it('should reject adding different owner items', async () => {
    // TODO: allowing groups and friends items to a shelf
    try {
      const shelf = await shelfPromise
      const item = await createItem(getUserB())
      const res = await authReq('post', endpoint, {
        id: shelf._id,
        items: [ item._id ]
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject adding items to a different owner shelf', async () => {
    try {
      const shelf = await createShelf(getUserB(), { listing: 'public' })
      const item = await createItem()
      const res = await authReq('post', endpoint, {
        id: shelf._id,
        items: [ item._id ]
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })
})
