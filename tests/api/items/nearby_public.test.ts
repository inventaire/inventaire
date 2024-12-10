import 'should'
import { map } from 'lodash-es'
import { createItem } from '#fixtures/items'
import { createUser, getRandomPosition } from '#fixtures/users'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import { waitForIndexation } from '#tests/api/utils/search'
import { publicReq } from '#tests/api/utils/utils'

const endpoint = '/api/items?action=nearby-public'

const userPosition = getRandomPosition()
const [ lat, lng ] = userPosition
const geolocatedUserPromise = createUser({ position: userPosition })
const bbox = fixedEncodeURIComponent(JSON.stringify([
  lng - 1, // minLng
  lat - 1, // minLat
  lng + 1, // maxLng
  lat + 1, // maxLat
]))

describe('items:nearby:public', () => {
  it('should get anonymized public items nearby', async () => {
    const user = await geolocatedUserPromise
    await waitForIndexation('users', user._id)
    const item = await createItem(user)
    const { items } = await publicReq('get', `${endpoint}&bbox=${bbox}&strict-range=true`)
    const itemsIds = map(items, '_id')
    itemsIds.includes(item._id).should.be.true()
    items[0].position.should.deepEqual(userPosition)
    should(items[0].owner).not.be.ok()
  })
})
