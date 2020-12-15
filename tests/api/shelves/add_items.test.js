const __ = require('config').universalPath
const { getUser, getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')
const { createGroup } = require('../fixtures/groups')

const endpoint = '/api/shelves?action=add-items'
const shelfPromise = createShelf()

describe('shelves:add-items', () => {
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
    const shelf = await shelfPromise
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
})

describe('shelves:group:add-items', () => {
  it('should reject if user is not a group member', async () => {
    const user = await getUser()
    const { _id: group } = await createGroup({ user })
    const shelf = await createShelf(user, {
      group,
      listing: 'private'
    })
    const item = await createItem()
    try {
      await authReqB('post', endpoint, {
        id: shelf._id,
        items: [ item._id ],
        group
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('user is not a group member')
      err.statusCode.should.equal(403)
    }
  })
})
