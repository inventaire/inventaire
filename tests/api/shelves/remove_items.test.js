const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getUserB, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { createShelf, createShelfWithItem } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')

const endpoint = '/api/shelves?action=remove-items'
const itemPromise = createItem
const shelfWithItemPromise = createShelfWithItem(itemPromise)

describe('shelves:remove-items', () => {
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
    const shelf = await shelfWithItemPromise
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

  it('should delete item from shelf', async () => {
    const shelf = await shelfWithItemPromise
    const itemId = shelf.items[0]
    const res = await authReq('post', endpoint, {
      id: shelf._id,
      items: [ itemId ]
    })
    res.shelves.should.be.ok()
    _.values(res.shelves)[0].items.length.should.equal(0)
  })

  it('should reject removing different owner items', async () => {
    try {
      const shelf = await shelfWithItemPromise
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

  it('should reject removing items of a different owner shelf', async () => {
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
      err.statusCode.should.equal(403)
    }
  })
})
