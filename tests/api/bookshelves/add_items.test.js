const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getUserB, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createBookshelf } = require('../fixtures/bookshelves')
const { createItem } = require('../fixtures/items')

const endpoint = '/api/bookshelves?action=add-items'
const bookshelfPromise = createBookshelf()

describe('bookshelves:add-items', () => {
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
    const bookshelf = await bookshelfPromise
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

  it('should add items', async () => {
    const bookshelf = await bookshelfPromise
    const item = await createItem()
    const res = await authReq('post', endpoint, {
      id: bookshelf._id,
      items: [ item._id ]
    })
    res.bookshelves.should.be.ok()
    const firstBookshelf = _.values(res.bookshelves)[0]
    firstBookshelf.items.should.be.an.Array()
    firstBookshelf.items[0]._id.should.be.ok()
  })

  it('should reject adding different owner items', async () => {
    try {
      const bookshelf = await bookshelfPromise
      const item = await createItem(getUserB())
      const res = await authReq('post', endpoint, {
        id: bookshelf._id,
        items: [ item._id ]
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.startWith('cannot add items to a different owner bookshelf')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject adding items to a different owner bookshelf', async () => {
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
      err.body.status_verbose.should.startWith('cannot add items to a different owner bookshelf')
      err.statusCode.should.equal(400)
    }
  })
})
