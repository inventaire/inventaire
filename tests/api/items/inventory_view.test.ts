import 'should'
import { createItem } from '#fixtures/items'
import { customAuthReq } from '#tests/api/utils/request'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { getSomeGroupWithAMember } from '../fixtures/groups.js'
import { createUserWithItems } from '../fixtures/populate.js'
import { createShelf, createShelfWithItem } from '../fixtures/shelves.js'

const endpoint = '/api/items?action=inventory-view'

describe('items:inventory-view', () => {
  it('should reject requests without a user or a group', async () => {
    publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: user or group or shelf')
    })
  })

  it('should return a user inventory-view', async () => {
    const item = await createItem()
    const res = await publicReq('get', `${endpoint}&user=${item.owner}`)
    res.worksTree.should.be.an.Object()
    res.worksTree.author.should.be.an.Object()
    res.worksTree.genre.should.be.an.Object()
    res.worksTree.subject.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
    res.itemsByDate.should.containEql(item._id)
    res.totalItems.should.be.a.Number()
  })

  it('should return an inventory-view for user items without shelf', async () => {
    const user = await createUserWithItems()
    const { shelf } = await createShelf(user)
    const { itemsByDate } = await customAuthReq(user, 'get', `${endpoint}&user=${user._id}&without-shelf=true`)
    const itemsCount = itemsByDate.length
    const allButOneItemsIds = itemsByDate.slice(0, itemsCount - 1)
    const itemIdRemainingWithoutShelf = itemsByDate.at(-1)
    await customAuthReq(user, 'post', '/api/shelves?action=add-items', {
      id: shelf._id,
      items: allButOneItemsIds,
    })
    const { itemsByDate: updatedItemsByDate } = await customAuthReq(user, 'get', `${endpoint}&user=${user._id}&without-shelf=true`)
    updatedItemsByDate.length.should.be.equal(1)
    updatedItemsByDate[0].should.equal(itemIdRemainingWithoutShelf)
  })

  it('should return a group inventory-view', async () => {
    const { group, member } = await getSomeGroupWithAMember()
    const item = await createItem(member, { visibility: [ 'public' ] })
    const res = await publicReq('get', `${endpoint}&group=${group._id}`)
    res.worksTree.should.be.an.Object()
    res.worksTree.author.should.be.an.Object()
    res.worksTree.genre.should.be.an.Object()
    res.worksTree.subject.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
    res.itemsByDate.should.containEql(item._id)
    res.totalItems.should.be.a.Number()
  })

  it('should return a shelf inventory-view', async () => {
    const { shelf, item } = await createShelfWithItem()
    const res = await publicReq('get', `${endpoint}&shelf=${shelf._id}`)
    res.worksTree.should.be.an.Object()
    res.worksTree.author.should.be.an.Object()
    res.worksTree.genre.should.be.an.Object()
    res.worksTree.subject.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
    res.itemsByDate.should.containEql(item._id)
    res.totalItems.should.be.a.Number()
  })
})
