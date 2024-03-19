import 'should'
import { publicReq } from '#tests/api/utils/utils'
import { populate } from '../fixtures/populate.js'

const lastPublicUrl = '/api/items?action=last-public'

describe('items:last-public', () => {
  it('can take an limit parameter', async () => {
    const limit = 2
    await populate({
      usersCount: 1,
      publicItemsPerUser: limit + 1,
    })
    const res = await publicReq('get', `${lastPublicUrl}&limit=${limit}`)
    res.items.length.should.equal(limit)
  })

  it('should fetch 15 last-public items', async () => {
    await populate({
      usersCount: 1,
      publicItemsPerUser: 16,
    })
    const res = await publicReq('get', lastPublicUrl)
    res.items.length.should.equal(15)
  })
})
