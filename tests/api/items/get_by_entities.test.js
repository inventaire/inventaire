const _ = require('builders/utils')
require('should')
const { getUser, authReq } = require('tests/api/utils/utils')
const { createItem, createItemWithEditionAndWork } = require('../fixtures/items')

describe('items:get-by-entities', () => {
  it('should get an item by its entity uri', async () => {
    const item = await createItem(getUser())
    const res = await authReq('get', `/api/items?action=by-entities&uris=${item.entity}`)
    res.items[0].entity.should.equal(item.entity)
  })

  it('should get items by entities uris', async () => {
    const items = await Promise.all([
      createItemWithEditionAndWork(getUser()),
      createItemWithEditionAndWork(getUser())
    ])
    const uris = _.uniq(_.map(items, 'entity'))
    const res = await authReq('get', `/api/items?action=by-entities&uris=${uris.join('|')}`)
    const resUserIds = _.uniq(_.map(res.items, 'entity'))
    resUserIds.should.containDeep(uris)
  })
})
