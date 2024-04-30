import { map } from 'lodash-es'
import should from 'should'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import { customAuthReq } from '#tests/api/utils/request'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { createUser, getRandomLatitude, getRandomPosition } from '../fixtures/users.js'
import { makeFriends } from '../utils/relations.js'
import { waitForIndexation } from '../utils/search.js'
import { publicReq, getUser } from '../utils/utils.js'

const position = getRandomPosition()
const [ lat, lng ] = position
const someUserWithPosition = createUser({ position })
const encodeBbox = bbox => fixedEncodeURIComponent(JSON.stringify(bbox))
const bboxIncludingUser = encodeBbox([
  lng - 1, // minLng
  lat - 1, // minLat
  lng + 1, // maxLng
  lat + 1, // maxLat
])

describe('users:search-by-position', () => {
  it('should get users by position', async () => {
    const user = await someUserWithPosition
    await waitForIndexation('users', user._id)
    const { users } = await publicReq('get', `/api/users?action=search-by-position&bbox=${bboxIncludingUser}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
  })

  it('should get semi-private data if user is in network', async () => {
    const user = await someUserWithPosition
    const requestingUser = await getUser()
    await makeFriends(user, requestingUser)
    await waitForIndexation('users', user._id)
    const { users } = await customAuthReq(requestingUser, 'get', `/api/users?action=search-by-position&bbox=${bboxIncludingUser}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
    foundUser.snapshot.network.should.be.an.Object()
  })

  it('should get private data if requested user is requester', async () => {
    const user = await someUserWithPosition
    await waitForIndexation('users', user._id)
    const { users } = await customAuthReq(user, 'get', `/api/users?action=search-by-position&bbox=${bboxIncludingUser}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
    foundUser.snapshot.network.should.be.an.Object()
    foundUser.snapshot.private.should.be.an.Object()
  })

  it('should support requests overlapping the anti-meridian', async () => {
    const latitude = getRandomLatitude()
    const extremeWestLatLng = [ latitude, -175 ]
    const extremeEastLatLng = [ latitude, 175 ]
    const [ extremeWestUser, extremeEastUser ] = await Promise.all([
      createUser({ position: extremeWestLatLng }),
      createUser({ position: extremeEastLatLng }),
    ])
    await Promise.all([
      waitForIndexation('users', extremeWestUser._id),
      waitForIndexation('users', extremeEastUser._id),
    ])
    const bbox = [
      -190, // minLng
      latitude - 1, // minLat
      -170, // maxLng
      latitude + 1, // maxLat
    ]
    const { users } = await publicReq('get', `/api/users?action=search-by-position&bbox=${encodeBbox(bbox)}`)
    const foundUsersIds = map(users, '_id')
    foundUsersIds.should.containEql(extremeWestUser._id)
    foundUsersIds.should.containEql(extremeEastUser._id)
  })

  it('should support requests fully overpassing the anti-meridian', async () => {
    const latitude = getRandomLatitude()
    const extremeEastLatLng = [ latitude, 175 ]
    const extremeEastUser = await createUser({ position: extremeEastLatLng })
    await waitForIndexation('users', extremeEastUser._id)
    const bbox = [
      -186, // minLng
      latitude - 1, // minLat
      -184, // maxLng
      latitude + 1, // maxLat
    ]
    const { users } = await publicReq('get', `/api/users?action=search-by-position&bbox=${encodeBbox(bbox)}`)
    const foundUsersIds = map(users, '_id')
    foundUsersIds.should.containEql(extremeEastUser._id)
  })

  it('should reject requests overlapping the anti-meridian twice', async () => {
    const bbox = [
      -190 - 360, // minLng
      -1, // minLat
      0, // maxLng
      1, // maxLat
    ]
    await publicReq('get', `/api/users?action=search-by-position&bbox=${encodeBbox(bbox)}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('invalid_bbox')
    })
  })
})
