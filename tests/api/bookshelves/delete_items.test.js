const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getUserB, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createBookshelfWithItem } = require('../fixtures/bookshelves')
const { createItem } = require('../fixtures/items')

const endpoint = '/api/bookshelves?action=delete-items'
const itemPromise = createItem
const bookshelfWithItemPromise = createBookshelfWithItem(itemPromise)

describe('bookshelves:delete-items', () => {
  it('should reject without bookshelf id', async () => {
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
    const bookshelf = await bookshelfWithItemPromise
    try {
      const res = await authReq('post', endpoint, {
        id: bookshelf._id
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: items')
      err.statusCode.should.equal(400)
    }
  })

  it('should delete items', async () => {
    const bookshelf = await bookshelfWithItemPromise
    const item = bookshelf.items[0]
    const res = await authReq('post', endpoint, {
      id: bookshelf._id,
      items: [ item._id ]
    })
    res.bookshelves.should.be.ok()
    _.values(res.bookshelves)[0].items.length.should.equal(0)
  })

  it('should reject removing different owner items', async () => {
    try {
      const bookshelf = await bookshelfWithItemPromise
      const item = await createItem(getUserB())
      const res = await authReq('post', endpoint, {
        id: bookshelf._id,
        items: [ item._id ]
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject removing items of a different owner bookshelf', async () => {
    try {
      const bookshelf = await Promise.resolve(
        authReqB('post', '/api/bookshelves?action=create', {
          description: 'wesh',
          listing: 'public',
          name: 'yolo bookshelf'
        })
      )
      const item = await createItem()
      const res = await authReq('post', endpoint, {
        id: bookshelf._id,
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
