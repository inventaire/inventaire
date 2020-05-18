const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { getReservedUser, customAuthReq } = require('../utils/utils')
const { createItem } = require('../fixtures/items')
const endpoint = '/api/items?action=search'
const { wait } = __.require('lib', 'promises')

const search = (reqUser, userId, search) => {
  search = encodeURIComponent(search)
  const url = `${endpoint}&user=${userId}&search=${search}`
  return customAuthReq(reqUser, 'get', url)
}

describe('items:search', () => {
  it('should find a user item', async () => {
    const user = await getReservedUser()
    const item = await createItem(user)
    await wait(1000)
    const { 'entity:title': title } = item.snapshot
    const { items } = await search(user, user._id, title)
    items[0]._id.should.equal(item._id)
  })
})
