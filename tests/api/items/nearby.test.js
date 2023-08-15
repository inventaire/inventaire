import _ from '#builders/utils'
import 'should'
import { createUser } from '#fixtures/users'
import { customAuthReq } from '#tests/api/utils/request'
import { createItem } from '../fixtures/items.js'
import { getRandomPosition } from '../fixtures/users.js'
import { waitForIndexation } from '../utils/search.js'

const positionUser1 = getRandomPosition()
const positionUser2 = [
  positionUser1[0] - 0.1,
  positionUser1[1] - 0.1,
]
const geolocatedUser1Promise = createUser({ position: positionUser1 })
const geolocatedUser2Promise = createUser({ position: positionUser2 })
const endpoint = '/api/items?action=nearby'

describe('items:nearby', () => {
  it('should get items nearby', async () => {
    const user = await geolocatedUser1Promise
    await waitForIndexation('users', user._id)
    const item = await createItem(user)
    const { items } = await customAuthReq(geolocatedUser2Promise, 'get', endpoint)
    const itemsIds = _.map(items, '_id')
    itemsIds.includes(item._id).should.be.true()
  })

  it('should accept a range', async () => {
    const user = await geolocatedUser1Promise
    await waitForIndexation('users', user._id)
    const item = await createItem(user)
    const { items } = await customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1&strict-range=true`)
    const itemsIds = _.map(items, '_id')
    itemsIds.includes(item._id).should.be.false()
  })
})
