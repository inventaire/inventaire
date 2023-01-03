import _ from '#builders/utils'
import { buildUrl } from '#lib/utils/url'
import { createShelf, createShelfWithItem } from '#tests/api/fixtures/shelves'
import { customAuthReq } from '#tests/api/utils/request'
import { createItem } from '../fixtures/items.js'
import { waitForIndexation } from '../utils/search.js'
import { getUser, publicReq } from '../utils/utils.js'

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
