require('should')
const { getUser, getReservedUser } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { createItem, createItems } = require('../fixtures/items')
const { groupPromise, createGroup } = require('../fixtures/groups')
const { createShelf, createShelfWithItems } = require('../fixtures/shelves')

describe('feeds:get', () => {
  describe('user', () => {
    it('should return a user RSS feed', async () => {
      const user = await getUser()
      const userId = user._id
      const { body } = await rawRequest('get', `/api/feeds?user=${userId}`)
      body.startsWith('<?xml').should.be.true()
    })

    it('should return a user RSS feed when the user has an item', async () => {
      const userPromise = getUser()
      const itemPromise = createItem(userPromise)

      const [ user, item ] = await Promise.all([
        userPromise,
        itemPromise
      ])
      const userId = user._id
      const { body } = await rawRequest('get', `/api/feeds?user=${userId}`)
      body.includes(item._id).should.be.true()
    })

    it('should not return private items when not authentified', async () => {
      const user = await getUser()
      const items = await createItems(user, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const { body } = await rawRequest('get', `/api/feeds?user=${user._id}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.false()
      body.includes(items[2]._id).should.be.false()
    })

    it('should not return private items when not authorized', async () => {
      const unknownUser = await getReservedUser()
      const items = await createItems(unknownUser, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const user = await getUser()
      const { _id: userId, readToken: token } = user
      const { body } = await rawRequest('get', `/api/feeds?user=${unknownUser._id}&requester=${userId}&token=${token}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.false()
      body.includes(items[2]._id).should.be.false()
    })

    it('should return private items when authorized', async () => {
      const user = await getUser()
      const items = await createItems(user, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const { _id: userId, readToken: token } = user
      const { body } = await rawRequest('get', `/api/feeds?user=${userId}&requester=${userId}&token=${token}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.true()
      body.includes(items[2]._id).should.be.true()
    })
  })

  describe('group', () => {
    it('should return a group RSS feed', async () => {
      const group = await groupPromise
      const { body } = await rawRequest('get', `/api/feeds?group=${group._id}`)
      body.startsWith('<?xml').should.be.true()
    })

    it('should not return private items when not authentified', async () => {
      const group = await groupPromise
      const user = await getUser()
      const items = await createItems(user, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const { body } = await rawRequest('get', `/api/feeds?group=${group._id}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.false()
      body.includes(items[2]._id).should.be.false()
    })

    it('should not return non-public items when not authorized', async () => {
      const groupMember = await getReservedUser()
      const group = await createGroup({ user: groupMember })
      const items = await createItems(groupMember, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const nonMemberUser = await getUser()
      const { _id: userId, readToken: token } = nonMemberUser
      const { body } = await rawRequest('get', `/api/feeds?group=${group._id}&requester=${userId}&token=${token}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.false()
      body.includes(items[2]._id).should.be.false()
    })

    it('should return private items when authorized', async () => {
      const group = await groupPromise
      const user = await getUser()
      const items = await createItems(user, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const { _id: userId, readToken: token } = user
      const { body } = await rawRequest('get', `/api/feeds?group=${group._id}&requester=${userId}&token=${token}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.true()
      // Not returning private items in group context
      body.includes(items[2]._id).should.be.false()
    })
  })

  describe('shelf', () => {
    it('should return a shelf RSS feed', async () => {
      const shelf = await createShelf(getUser(), { listing: 'public' })
      const { body } = await rawRequest('get', `/api/feeds?shelf=${shelf._id}`)
      body.startsWith('<?xml').should.be.true()
    })

    it('should not return private items when not authorized', async () => {
      const user = await getUser()
      const items = await createItems(user, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const { shelf } = await createShelfWithItems({ listing: 'public' }, items)
      const { body } = await rawRequest('get', `/api/feeds?shelf=${shelf._id}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.false()
      body.includes(items[2]._id).should.be.false()
    })

    it('should return private items when authorized', async () => {
      const user = await getUser()
      const items = await createItems(user, [
        { listing: 'public' },
        { listing: 'network' },
        { listing: 'private' },
      ])
      const { _id: userId, readToken: token } = user
      const { shelf } = await createShelfWithItems({ listing: 'public' }, items)
      const { body } = await rawRequest('get', `/api/feeds?shelf=${shelf._id}&requester=${userId}&token=${token}`)
      body.startsWith('<?xml').should.be.true()
      body.includes(items[0]._id).should.be.true()
      body.includes(items[1]._id).should.be.true()
      body.includes(items[2]._id).should.be.true()
    })
  })
})
