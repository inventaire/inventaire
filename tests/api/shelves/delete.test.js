const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createShelf, createShelfWithItem } = require('../fixtures/shelves')

const endpoint = '/api/shelves?action=delete'
const shelfPromise = createShelf()
const shelfWithItemsPromise = createShelfWithItem()

describe('shelves:delete', () => {
  it('should reject without shelf id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject deleting different owner shelf', async () => {
    try {
      const shelf = await shelfPromise
      const res = await authReqB('post', endpoint, { ids: shelf._id })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('wrong owner')
      err.statusCode.should.equal(403)
    }
  })

  it('should delete shelf', async () => {
    const shelf = await shelfPromise
    const { _id: shelfId } = shelf
    const res = await authReq('post', endpoint, { ids: shelfId })
    res.ok.should.be.true()
    const getShelfRes = await authReq('get', `/api/shelves?action=by-ids&ids=${shelfId}`)

    _.values(getShelfRes.shelves).length.should.equal(0)
  })

  describe('with-items', () => {
    it('should reject deleting shelf', async () => {
      try {
        const shelf = await shelfWithItemsPromise
        const { _id: shelfId } = shelf
        const res = await authReq('post', endpoint, { ids: shelfId })
        shouldNotGetHere(res)
      } catch (err) {
        rethrowShouldNotGetHereErrors(err)
        err.body.status_verbose.should.startWith('shelf cannot be deleted')
        err.statusCode.should.equal(403)
      }
    })

    it('should delete shelf and items', async () => {
      const shelf = await shelfWithItemsPromise
      const itemId = shelf.items[0]
      const { _id: shelfId } = shelf
      const res = await authReq('post', endpoint, { ids: shelfId, 'with-items': true })
      res.ok.should.be.true()
      const getItemsRes = await authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
      _.values(getItemsRes.items).length.should.equal(0)
    })
  })
})
