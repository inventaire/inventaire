import { map } from 'lodash-es'
import should from 'should'
import { createItem } from '#fixtures/items'
import { createUser, getRandomPosition } from '#fixtures/users'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import { waitForIndexation } from '#tests/api/utils/search'
import { publicReq } from '#tests/api/utils/utils'
import type { LatLng } from '#types/common'

const endpoint = '/api/items?action=by-bbox'

const userPosition: LatLng = getRandomPosition()
const [ lat, lng ] = userPosition
let geolocatedUser
const bbox: string = fixedEncodeURIComponent(JSON.stringify([
  lng - 1, // minLng
  lat - 1, // minLat
  lng + 1, // maxLng
  lat + 1, // maxLat
]))

describe('items:public:by-bbox', () => {
  before(async () => {
    geolocatedUser = await createUser({ position: userPosition })
  })

  it('should get public items nearby', async () => {
    await waitForIndexation('users', geolocatedUser._id)
    const item = await createItem(geolocatedUser)
    const { items } = await publicReq('get', `${endpoint}&bbox=${bbox}`)
    const itemsIds = map(items, '_id')
    itemsIds.includes(item._id).should.be.true()
  })

  it('should include users public data', async () => {
    await waitForIndexation('users', geolocatedUser._id)
    const { items, users } = await publicReq('get', `${endpoint}&bbox=${bbox}`)
    users.length.should.be.above(0)
    for (const user of users) {
      user.username.should.be.ok()
      should(user.email).not.be.ok()
    }
    for (const item of items) {
      should(users.find(user => user._id === item.owner)).be.ok()
    }
  })
})
