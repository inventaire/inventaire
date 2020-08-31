const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { customAuthReq, nonAuthReq, undesiredRes, getReservedUser } = __.require('apiTests', 'utils/utils')
const endpoint = '/api/items?action=inventory-view'
const { groupPromise, createGroup, addMember } = require('../fixtures/groups')
const { createEdition } = require('../fixtures/entities')
const { createUserWithItems } = require('../fixtures/populate')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { newItemBase } = require('../items/helpers')
const { addClaim } = require('../utils/entities')
const editionUriPromise = createEdition().then(({ uri }) => uri)
const userPromise = createUserWithItems()

describe('items:inventory-view', () => {
  it('should reject requests without a user or a group', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: user or group')
      done()
    })
    .catch(done)
  })

  describe('cache update', () => {
    it('should refresh on item creation', async () => {
      const { _id: userId } = await userPromise
      const { itemsByDate: oldItemsByDate } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      const editionUri = await editionUriPromise

      await customAuthReq(userPromise, 'post', '/api/items', { entity: editionUri, listing: 'public' })
      await wait(100)
      const { itemsByDate: refreshedItemsByDate } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      refreshedItemsByDate.length.should.equal(oldItemsByDate.length + 1)
    })

    it('should refresh on private item creation', async () => {
      const { _id: userId } = await userPromise
      const { itemsByDate: oldItemsByDate } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      const editionUri = await editionUriPromise

      await customAuthReq(userPromise, 'post', '/api/items', { entity: editionUri, listing: 'private' })
      await wait(100)
      const { itemsByDate: ownerViewFreshItems } = await customAuthReq(userPromise, 'get', `${endpoint}&user=${userId}`)
      ownerViewFreshItems.length.should.equal(oldItemsByDate.length + 1)
    })

    it('should refresh on private to public item update', async () => {
      const userPromise = createUser()
      const { _id: userId } = await userPromise
      const item = await customAuthReq(userPromise, 'post', '/api/items', newItemBase())
      const { itemsByDate: privateItemsByDate } = await customAuthReq(userPromise, 'get', `${endpoint}&user=${userId}`)
      const { itemsByDate: publicItemsByDate } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      publicItemsByDate.length.should.equal(privateItemsByDate.length - 1)
      item.listing = 'public'

      await customAuthReq(userPromise, 'put', '/api/items', item)
      await wait(100)
      const { itemsByDate: publicItemsByDate2 } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      publicItemsByDate2.length.should.equal(privateItemsByDate.length)
    })

    it('should refresh on item deletion', async () => {
      const { _id: userId } = await userPromise
      const editionUri = await editionUriPromise
      const { _id: itemId } = await customAuthReq(userPromise, 'post', '/api/items', { entity: editionUri, listing: 'public' })
      await customAuthReq(userPromise, 'post', '/api/items?action=delete-by-ids', { ids: [ itemId ] })
      await wait(200)
      const { itemsByDate: refreshedItemsByDate } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      refreshedItemsByDate.should.not.containEql(itemId)
    })
  })

  describe('user', () => {
    it('should return a user inventory-view', async () => {
      const { _id: userId } = await createUserWithItems()
      const { worksTree, workUriItemsMap, itemsByDate } = await nonAuthReq('get', `${endpoint}&user=${userId}`)
      worksTree.should.be.an.Object()
      worksTree.author.should.be.an.Object()
      worksTree.genre.should.be.an.Object()
      worksTree.subject.should.be.an.Object()
      workUriItemsMap.should.be.an.Object()
      itemsByDate.should.be.an.Array()
    })
  })

  describe('group', () => {
    it('should return a group inventory-view', async () => {
      const { _id: groupId } = await groupPromise
      const { worksTree, workUriItemsMap, itemsByDate } = await nonAuthReq('get', `${endpoint}&group=${groupId}`)
      worksTree.should.be.an.Object()
      worksTree.author.should.be.an.Object()
      worksTree.genre.should.be.an.Object()
      worksTree.subject.should.be.an.Object()
      workUriItemsMap.should.be.an.Object()
      itemsByDate.should.be.an.Array()
    })

    it('should return itemsByDate sorted by date', async () => {
      const memberA = await getReservedUser()
      const memberB = await getReservedUser()
      const group = await createGroup({ user: memberA })
      await addMember({ group, admin: memberA, user: memberB })
      const { _id: itemA1Id, created: itemA1Created } = await createItem(memberA)
      const { _id: itemB1Id, created: itemB1Created } = await createItem(memberB)
      const { _id: itemA2Id, created: itemA2Created } = await createItem(memberA)
      should(itemB1Created > itemA1Created).be.true()
      should(itemA2Created > itemB1Created).be.true()
      const { itemsByDate } = await nonAuthReq('get', `${endpoint}&group=${group._id}`)
      itemsByDate.should.deepEqual([ itemA1Id, itemB1Id, itemA2Id ])
    })

    it('should return deduplicated worksTree subarrays', async () => {
      const memberA = await getReservedUser()
      const memberB = await getReservedUser()
      const group = await createGroup({ user: memberA })
      await addMember({ group, admin: memberA, user: memberB })
      const edition = await createEdition()
      const workUri = edition.claims['wdt:P629'][0]
      await createItem(memberA, { entity: edition.uri })
      await createItem(memberB, { entity: edition.uri })
      const { worksTree } = await nonAuthReq('get', `${endpoint}&group=${group._id}`)
      const { author, genre, subject } = worksTree
      author.unknown.should.deepEqual([ workUri ])
      genre.unknown.should.deepEqual([ workUri ])
      subject.unknown.should.deepEqual([ workUri ])
    })
  })
})
