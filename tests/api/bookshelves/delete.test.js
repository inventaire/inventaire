const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createBookshelf, createBookshelfWithItem } = require('../fixtures/bookshelves')
const { Promise } = __.require('lib', 'promises')

const endpoint = '/api/bookshelves?action=delete'
const bookshelfPromise = createBookshelf()
const bookshelfWithItemsPromise = createBookshelfWithItem()

describe('bookshelves:delete', () => {
  it('should reject without bookshelf id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject deleting different owner bookshelf', async () => {
    try {
      const bookshelf = await bookshelfPromise
      const res = await authReqB('post', endpoint, { ids: bookshelf._id })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal("user isn't bookshelf owner")
      err.statusCode.should.equal(403)
    }
  })

  it('should delete bookshelf', async () => {
    const bookshelf = await bookshelfPromise
    const { _id: bookshelfId } = bookshelf
    const res = await authReq('post', endpoint, { ids: bookshelfId })
    res.ok.should.be.true()
    await Promise.resolve().delay(300)
    const getBookshelfRes = await authReq('get', `/api/bookshelves?action=by-ids&ids=${bookshelfId}`)
    _.values(getBookshelfRes.bookshelves).length.should.equal(0)
  })

  describe('with-items', () => {
    it('should reject deleting bookshelf', async () => {
      try {
        const bookshelf = await bookshelfWithItemsPromise
        const { _id: bookshelfId } = bookshelf
        const res = await authReq('post', endpoint, { ids: bookshelfId })
        shouldNotGetHere(res)
      } catch (err) {
        rethrowShouldNotGetHereErrors(err)
        err.body.status_verbose.should.startWith('bookshelf cannot be deleted')
        err.statusCode.should.equal(403)
      }
    })

    it('should delete bookshelf and items', async () => {
      const bookshelf = await bookshelfWithItemsPromise
      const itemId = bookshelf.items[0]._id
      const { _id: bookshelfId } = bookshelf
      const res = await authReq('post', endpoint, { ids: bookshelfId, 'with-items': true })
      res.ok.should.be.true()
      await Promise.resolve().delay(300)
      const getItemsRes = await authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
      _.values(getItemsRes.items).length.should.equal(0)
    })
  })
})
