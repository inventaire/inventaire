const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, authReq } = __.require('apiTests', 'utils/utils')
const { createItem, createEditionAndItem } = require('../fixtures/items')

const endpoint = '/api/items?action=by-user-and-entities'

describe('items:get-by-user-and-entities', () => {
  it('should get an item by its owner id and entity uri', async () => {
    const item = await createItem(getUser())
    const { items } = await authReq('get', `${endpoint}&user=${item.owner}&uris=${item.entity}`)
    const itemsIds = _.map(items, '_id')
    itemsIds.includes(item._id).should.be.true()
    for (const resItem of items) {
      resItem.entity.should.equal(item.entity)
      resItem.owner.should.equal(item.owner)
    }
  })

  it('should not get items of not requested entity uris', async () => {
    const [ item ] = await Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(getUser())
    ])
    const { owner, entity: uri } = item
    const { items } = await authReq('get', `${endpoint}&user=${owner}&uris=${uri}`)
    items.length.should.equal(1)
  })

  it('should get items by their entity uri', async () => {
    const itemA = await createEditionAndItem(getUser())
    const uri = itemA.entity
    const itemB = await createItem(getUser(), { entity: uri })
    const { items } = await authReq('get', `${endpoint}&user=${itemA.owner}&uris=${uri}`)
    const itemsIds = [ itemA._id, itemB._id ]
    const resItemsIds = _.map(items, '_id')
    resItemsIds.should.containDeep(itemsIds)
  })

  it('should get items by their entity uris', async () => {
    const items = await Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(getUser())
    ])
    const uris = _.map(items, 'entity')
    const { owner } = items[0]
    const res = await authReq('get', `${endpoint}&user=${owner}&uris=${uris.join('|')}`)
    res.items.length.should.equal(2)
  })
})
