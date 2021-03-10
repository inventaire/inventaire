const _ = require('builders/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('apiTests/utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createShelf, createShelfWithItem } = require('../fixtures/shelves')

const endpoint = '/api/shelves?action=delete'

describe('shelves:delete', () => {
  it('should reject without shelf id', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject deleting different owner shelf', async () => {
    try {
      const shelf = await createShelf()
      await authReqB('post', endpoint, { ids: shelf._id }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong owner')
      err.statusCode.should.equal(403)
    }
  })

  it('should delete shelf but not the items', async () => {
    const { shelf } = await createShelfWithItem()
    const itemId = shelf.items[0]
    const { _id: shelfId } = shelf
    const res = await authReq('post', endpoint, { ids: shelfId })
    res.shelves.should.be.an.Array()

    const getShelfRes = await authReq('get', `/api/shelves?action=by-ids&ids=${shelfId}`)
    _.values(getShelfRes.shelves).length.should.equal(0)

    const getItemsRes = await authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
    _.values(getItemsRes.items).length.should.not.equal(0)
  })

  describe('with-items', () => {
    it('should delete shelf and items', async () => {
      const { shelf } = await createShelfWithItem()
      const itemId = shelf.items[0]
      const { _id: shelfId } = shelf
      const res = await authReq('post', endpoint, { ids: shelfId, 'with-items': true })
      res.items.should.be.an.Array()
      const getItemsRes = await authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
      _.values(getItemsRes.items).length.should.equal(0)
    })
  })
})
