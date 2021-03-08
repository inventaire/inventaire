const __ = require('config').universalPath
const _ = require('builders/utils')
const { getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('apiTests/utils/utils')
const { authReq } = require('../utils/utils')
const { createShelf, createShelfWithItem } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')

const endpoint = '/api/shelves?action=remove-items'

describe('shelves:remove-items', () => {
  it('should reject without shelf id', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without items', async () => {
    const { shelf } = await createShelfWithItem()
    try {
      await authReq('post', endpoint, {
        id: shelf._id
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: items')
      err.statusCode.should.equal(400)
    }
  })

  it('should delete item from shelf', async () => {
    const { shelf } = await createShelfWithItem()
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
      const { shelf } = await createShelfWithItem()
      const item = await createItem(getUserB())
      await authReq('post', endpoint, {
        id: shelf._id,
        items: [ item._id ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject removing items of a different owner shelf', async () => {
    try {
      const shelf = await createShelf(getUserB(), { listing: 'public' })
      const item = await createItem()
      await authReq('post', endpoint, {
        id: shelf._id,
        items: [ item._id ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(403)
    }
  })
})
