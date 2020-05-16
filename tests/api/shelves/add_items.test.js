const __ = require('config').universalPath
const { getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')

const endpoint = '/api/shelves?action=add-items'
const shelfPromise = createShelf()

describe('shelves:add-items', () => {
  it('should reject without shelf id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
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
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
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
    const firstShelf = res.shelves[shelf._id]
    firstShelf.items.should.be.an.Array()
    firstShelf.items.length.should.be.above(0)
    firstShelf.items[0].should.equal(id)
  })

  it('should reject adding different owner items', async () => {
    try {
      const shelf = await shelfPromise
      const item = await createItem(getUserB())
      const res = await authReq('post', endpoint, {
        id: shelf._id,
        items: [ item._id ]
      })
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })
})
