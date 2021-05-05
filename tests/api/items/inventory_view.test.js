require('should')
const { publicReq, undesiredRes } = require('tests/api/utils/utils')
const { customAuthReq } = require('tests/api/utils/request')
const endpoint = '/api/items?action=inventory-view'
const { groupPromise } = require('../fixtures/groups')
const { createShelf } = require('../fixtures/shelves')
const { createUserWithItems } = require('../fixtures/populate')

describe('items:inventory-view', () => {
  it('should reject requests without a user or a group', done => {
    publicReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: user or group or shelf')
      done()
    })
    .catch(done)
  })

  it('should return a user inventory-view', async () => {
    const { _id: userId } = await createUserWithItems()
    const res = await publicReq('get', `${endpoint}&user=${userId}`)
    res.worksTree.should.be.an.Object()
    res.worksTree.author.should.be.an.Object()
    res.worksTree.genre.should.be.an.Object()
    res.worksTree.subject.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
  })

  it('should return an inventory-view for user items without shelf', async () => {
    const user = await createUserWithItems()
    const shelf = await createShelf(user)
    const { itemsByDate } = await customAuthReq(user, 'get', `${endpoint}&user=${user._id}&without-shelf=true`)
    const itemsCount = itemsByDate.length
    const allButOneItemsIds = itemsByDate.slice(0, itemsCount - 1)
    const itemIdRemainingWithoutShelf = itemsByDate.slice(-1)[0]
    await customAuthReq(user, 'post', '/api/shelves?action=add-items', {
      id: shelf._id,
      items: allButOneItemsIds
    })
    const { itemsByDate: updatedItemsByDate } = await customAuthReq(user, 'get', `${endpoint}&user=${user._id}&without-shelf=true`)
    updatedItemsByDate.length.should.be.equal(1)
    updatedItemsByDate[0].should.equal(itemIdRemainingWithoutShelf)
  })

  it('should return a group inventory-view', done => {
    groupPromise
    .then(({ _id }) => _id)
    .then(groupId => publicReq('get', `${endpoint}&group=${groupId}`))
    .then(res => {
      res.worksTree.should.be.an.Object()
      res.worksTree.author.should.be.an.Object()
      res.worksTree.genre.should.be.an.Object()
      res.worksTree.subject.should.be.an.Object()
      res.worksTree.owner.should.be.an.Object()
      res.workUriItemsMap.should.be.an.Object()
      res.itemsByDate.should.be.an.Array()
      done()
    })
    .catch(done)
  })

  it('should return a shelf inventory-view', async () => {
    const shelf = await createShelf()
    const res = await publicReq('get', `${endpoint}&shelf=${shelf._id}`)
    res.worksTree.should.be.an.Object()
    res.worksTree.author.should.be.an.Object()
    res.worksTree.genre.should.be.an.Object()
    res.worksTree.subject.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
  })
})
