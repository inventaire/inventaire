const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { nonAuthReq, undesiredRes, getReservedUser } = __.require('apiTests', 'utils/utils')
const endpoint = '/api/items?action=inventory-view'
const { groupPromise, createGroup, addMember } = require('../fixtures/groups')
const { createItem } = require('../fixtures/items')
const { createUserWithItems } = require('../fixtures/populate')

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
  })
})
