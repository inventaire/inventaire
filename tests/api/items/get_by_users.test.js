const _ = require('builders/utils')
require('should')
const { getUser, getUserB, authReq } = require('tests/api/utils/utils')
const { shouldNotBeCalled } = require('tests/unit/utils')
const { createItem } = require('../fixtures/items')

describe('items:get-by-users', () => {
  it('should get an item by id', async () => {
    const item = await createItem(getUser())
    const { items } = await authReq('get', `/api/items?action=by-users&users=${item.owner}`)
    items[0]._id.should.equal(item._id)
  })

  it('should get items by ids', async () => {
    const items = await Promise.all([
      createItem(getUser(), { listing: 'private' }),
      createItem(getUser(), { listing: 'public' }),
      createItem(getUserB(), { listing: 'public' })
    ])
    const usersIds = _.map(items.slice(1), 'owner')
    const itemsIds = _.map(items, '_id')
    const res = await authReq('get', `/api/items?action=by-users&users=${usersIds.join('|')}`)
    const resUsersIds = _.uniq(_.map(res.items, 'owner'))
    resUsersIds.should.containDeep(usersIds)
    const resItemsIds = _.uniq(_.map(res.items, '_id'))
    resItemsIds.should.containDeep(itemsIds)
  })

  it("should get items by ids with a filter set to 'group'", async () => {
    const items = await Promise.all([
      createItem(getUser(), { listing: 'private' }),
      createItem(getUser(), { listing: 'public' }),
      createItem(getUserB(), { listing: 'public' })
    ])
    const privateItemId = items[0]._id
    const usersIds = _.map(items.slice(1), 'owner')
    const res = await authReq('get', `/api/items?action=by-users&users=${usersIds.join('|')}&filter=group`)
    const resUsersIds = _.uniq(_.map(res.items, 'owner'))
    resUsersIds.should.containDeep(usersIds)
    const resItemsIds = _.uniq(_.map(res.items, '_id'))
    resItemsIds.should.not.containEql(privateItemId)
  })

  it("should reject invalid filters'", async () => {
    const user = await getUser()
    const { _id: userId } = user
    await authReq('get', `/api/items?action=by-users&users=${userId}&filter=bla`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid filter')
    })
  })
})
