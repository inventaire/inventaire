import should from 'should'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import { customAuthReq } from '#tests/api/utils/request'
import { createUser, getRandomPosition } from '../fixtures/users.js'
import { makeFriends } from '../utils/relations.js'
import { waitForIndexation } from '../utils/search.js'
import { publicReq, getUser } from '../utils/utils.js'

const position = getRandomPosition()
const [ lat, lng ] = position
const someUserWithPosition = createUser({ position })
const bbox = fixedEncodeURIComponent(JSON.stringify([
  lng - 1, // minLng
  lat - 1, // minLat
  lng + 1, // maxLng
  lat + 1, // maxLat
]))

describe('users:search-by-position', () => {
  it('should get users by position', async () => {
    const user = await someUserWithPosition
    await waitForIndexation('users', user._id)
    const { users } = await publicReq('get', `/api/users?action=search-by-position&bbox=${bbox}`)
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
    const { users } = await customAuthReq(requestingUser, 'get', `/api/users?action=search-by-position&bbox=${bbox}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
    foundUser.snapshot.network.should.be.an.Object()
  })

  it('should get private data if requested user is requester', async () => {
    const user = await someUserWithPosition
    await waitForIndexation('users', user._id)
    const { users } = await customAuthReq(user, 'get', `/api/users?action=search-by-position&bbox=${bbox}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
    foundUser.snapshot.network.should.be.an.Object()
    foundUser.snapshot.private.should.be.an.Object()
  })
})
