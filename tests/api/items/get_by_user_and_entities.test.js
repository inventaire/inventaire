const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { getUser, authReq, customAuthReq, nonAuthReq } = __.require('apiTests', 'utils/utils')
const { createItem, createItemWithEditionAndWork } = require('../fixtures/items')
const { getTwoFriends } = require('../fixtures/users')

const endpoint = '/api/items?action=by-user-and-entities'

describe('items:get-by-user-and-entities', () => {
  it('should not get items of not requested entity uris', async () => {
    const [ item ] = await Promise.all([
      createItemWithEditionAndWork(getUser()),
      createItemWithEditionAndWork(getUser())
    ])
    const { owner, entity: uri } = item
    const { items } = await authReq('get', `${endpoint}&user=${owner}&uris=${uri}`)
    items.length.should.equal(1)
  })

  it('should get items by their entity uri', async () => {
    const itemA = await createItemWithEditionAndWork(getUser())
    const uri = itemA.entity
    const itemB = await createItem(getUser(), { entity: uri })
    const { items } = await authReq('get', `${endpoint}&user=${itemA.owner}&uris=${uri}`)
    const itemsIds = [ itemA._id, itemB._id ]
    const resItemsIds = _.map(items, '_id')
    resItemsIds.should.containDeep(itemsIds)
  })

  it('should get items by their entity uris', async () => {
    const items = await Promise.all([
      createItemWithEditionAndWork(getUser()),
      createItemWithEditionAndWork(getUser())
    ])
    const uris = _.map(items, 'entity')
    const { owner } = items[0]
    const res = await authReq('get', `${endpoint}&user=${owner}&uris=${uris.join('|')}`)
    res.items.length.should.equal(2)
  })

  it('should not include users by default', async () => {
    const item = await createItemWithEditionAndWork(getUser())
    const { users } = await authReq('get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
    should(users).not.be.ok()
  })

  it('should include users if requested', async () => {
    const item = await createItemWithEditionAndWork(getUser())
    const { users } = await authReq('get', `${endpoint}&user=${item.owner}&uris=${item.entity}&include-users=true`)
    users.should.be.an.Array()
    users[0]._id.should.equal(item.owner)
  })

  describe('with access rights', () => {
    it('should get a public item', async () => {
      const item = await createItemWithEditionAndWork(getUser())
      const { items } = await nonAuthReq('get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
      const foundItem = items[0]
      foundItem._id.should.equal(item._id)
      foundItem.entity.should.equal(item.entity)
      foundItem.owner.should.equal(item.owner)
    })

    it('should get a network item', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const item = await createItemWithEditionAndWork(userA, { listing: 'network' })
      const { items } = await customAuthReq(userB, 'get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
      const foundItem = items[0]
      foundItem._id.should.equal(item._id)
      foundItem.entity.should.equal(item.entity)
      foundItem.owner.should.equal(item.owner)
    })

    it('should get a private item', async () => {
      const item = await createItemWithEditionAndWork(getUser(), { listing: 'private' })
      const { items } = await authReq('get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
      const foundItem = items[0]
      foundItem._id.should.equal(item._id)
      foundItem.entity.should.equal(item.entity)
      foundItem.owner.should.equal(item.owner)
    })
  })

  describe('without access rights', () => {
    it('should not get a network item', async () => {
      const item = await createItemWithEditionAndWork(getUser(), { listing: 'network' })
      const { items } = await nonAuthReq('get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
      items.length.should.equal(0)
    })

    it('should not get a private item', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const item = await createItemWithEditionAndWork(userA, { listing: 'private' })
      const { items } = await customAuthReq(userB, 'get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
      items.length.should.equal(0)
    })
  })
})
