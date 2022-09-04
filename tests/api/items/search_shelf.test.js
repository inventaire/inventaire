const _ = require('builders/utils')
const { getUser, customAuthReq, publicReq } = require('../utils/utils')
const { waitForIndexation } = require('../utils/search')
const { createItem } = require('../fixtures/items')
const { buildUrl } = require('lib/utils/url')
const { createShelf, createShelfWithItem } = require('tests/api/fixtures/shelves')

const search = (reqUser, { shelf, search }) => {
  const url = buildUrl('/api/items', {
    action: 'search',
    shelf,
    search,
  })
  if (reqUser) {
    return customAuthReq(reqUser, 'get', url)
  } else {
    return publicReq('get', url)
  }
}

describe('items:search:shelves', () => {
  it('should find a public shelf public item', async () => {
    const { shelf, item } = await createShelfWithItem({ visibility: [ 'public' ] }, { visibility: [ 'public' ] })
    await waitForIndexation('items', item._id)
    const { 'entity:title': title } = item.snapshot
    const { items } = await search(null, { shelf: shelf._id, search: title })
    _.map(items, '_id').should.containEql(item._id)
  })

  it('should not find an item not in the shelf', async () => {
    const user = getUser()
    const [ { shelf }, item ] = await Promise.all([
      createShelf(user, { visibility: [ 'public' ] }),
      createItem(user, { visibility: [ 'public' ] }),
    ])
    await waitForIndexation('items', item._id)
    const { 'entity:title': title } = item.snapshot
    const { items } = await search(null, { shelf: shelf._id, search: title })
    _.map(items, '_id').should.not.containEql(item._id)
  })
})
