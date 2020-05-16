const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB, getUser, customAuthReq } = require('../utils/utils')
const { createUser } = require('../fixtures/users')
const { createShelf } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')
const { makeFriends } = require('../utils/relations')

const endpoint = '/api/shelves?action=by-ids'

describe('shelves:by-ids', () => {
  it('should reject without ids', async () => {
    try {
      const res = await authReq('get', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should get shelves', async () => {
    const shelf = await createShelf()
    const res = await authReq('get', `${endpoint}&ids=${shelf._id}`)
    res.shelves.should.be.ok()
  })

  it('should not return non friends network shelves', async () => {
    const shelf = await createShelf(null, { listing: 'private' })
    const res = await authReqB('get', `${endpoint}&ids=${shelf._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })

  it('should return owner private shelves', async () => {
    const shelf = await createShelf(null, { listing: 'private' })
    const res = await authReq('get', `${endpoint}&ids=${shelf._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.containEql(shelf._id)
  })

  it('should not return private shelves', async () => {
    const shelf = await createShelf(null, { listing: 'private' })
    const res = await authReqB('get', `${endpoint}&ids=${shelf._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })

  it('should not return network shelves', async () => {
    const shelf = await createShelf(null, { listing: 'network' })
    const res = await authReqB('get', `${endpoint}&ids=${shelf._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })

  it('should return friends network shelves', async () => {
    const friend = await createUser()
    const user = await getUser()
    await makeFriends(friend, user)
    const shelf = await createShelf(null, { listing: 'network' })
    const res = await customAuthReq(friend, 'get', `${endpoint}&ids=${shelf._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.containEql(shelf._id)
  })

  it('should not return friends private shelves', async () => {
    const friend = await createUser()
    const user = await getUser()
    await makeFriends(friend, user)
    const shelf = await createShelf(null, { listing: 'private' })
    const res = await customAuthReq(friend, 'get', `${endpoint}&ids=${shelf._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })

  describe('with-items', () => {
    it('should get shelves items when passing with-items params', async () => {
      const shelf = await createShelf()
      const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
      _.values(res.shelves)[0].items.should.be.an.Array()
    })

    describe('public shelf', () => {
      it('should get public items', async () => {
        const item = await createItem(getUser(), { listing: 'public' })
        const shelf = await createShelf()
        await addItem(shelf._id, item._id)
        const res = await authReqB('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = _.values(res.shelves)[0]
        resShelf.items.should.containEql(item._id)
      })

      it('should not get network items', async () => {
        const item = await createItem(getUser(), { listing: 'network' })
        const shelf = await createShelf()
        await addItem(shelf._id, item._id)
        const res = await authReqB('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = _.values(res.shelves)[0]
        resShelf.items.should.not.containEql(item._id)
      })
      it('should not get private items', async () => {
        const item = await createItem(getUser(), { listing: 'private' })
        const shelf = await createShelf()
        await addItem(shelf._id, item._id)
        const res = await authReqB('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = _.values(res.shelves)[0]
        resShelf.items.should.not.containEql(item._id)
      })
    })

    describe('network shelf', () => {
      it('should not get private items', async () => {
        const friend = await createUser()
        const user = await getUser()
        await makeFriends(friend, user)
        const item = await createItem(friend, { listing: 'private' })
        const shelf = await createShelf(friend, { listing: 'network' })
        await addItem(shelf._id, item._id, friend)
        const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = _.values(res.shelves)[0]
        resShelf.items.should.not.containEql(item._id)
      })

      it('should get network items', async () => {
        const friend = await createUser()
        const user = await getUser()
        await makeFriends(friend, user)
        const item = await createItem(friend, { listing: 'network' })
        const shelf = await createShelf(friend, { listing: 'network' })
        await addItem(shelf._id, item._id, friend)
        const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = _.values(res.shelves)[0]
        resShelf.items.should.containEql(item._id)
      })

      it('should get public items', async () => {
        const friend = await createUser()
        const item = await createItem(friend)
        const shelf = await createShelf(friend, { listing: 'network' })
        await addItem(shelf._id, item._id, friend)
        const user = await getUser()
        await makeFriends(friend, user)
        const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
        const resShelf = _.values(res.shelves)[0]
        resShelf.items.should.containEql(item._id)
      })
    })
  })
})

const addItem = async (shelfId, itemId, userPromise) => {
  if (!userPromise) userPromise = getUser()
  return customAuthReq(userPromise, 'post', '/api/shelves?action=add-items', {
    id: shelfId,
    items: [ itemId ]
  })
}
