const should = require('should')
const { nonAuthReq, customAuthReq, getUser } = require('../utils/utils')
const { createUser } = require('../fixtures/users')
const { makeFriends } = require('../utils/relations')
const qs = require('querystring')
const someUserWithPosition = createUser({ position: [ 1, 1 ] }).delay(100)
const bbox = qs.escape(JSON.stringify([ 0, 0, 2, 2 ]))

describe('users:search-by-position', () => {
  it('should get users by position', async () => {
    const user = await someUserWithPosition
    const { users } = await nonAuthReq('get', `/api/users?action=search-by-position&bbox=${bbox}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
  })

  it('should get semi-private data if user is in network', async () => {
    const user = await someUserWithPosition
    const requestingUser = await getUser()
    await makeFriends(user, requestingUser)
    const { users } = await customAuthReq(requestingUser, 'get', `/api/users?action=search-by-position&bbox=${bbox}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
    foundUser.snapshot.network.should.be.an.Object()
  })

  it('should get private data if requested user is requester', async () => {
    const user = await someUserWithPosition
    const { users } = await customAuthReq(user, 'get', `/api/users?action=search-by-position&bbox=${bbox}`)
    users.should.be.an.Array()
    const foundUser = users.find(userDoc => userDoc._id === user._id)
    should(foundUser).be.ok()
    foundUser.snapshot.public.should.be.an.Object()
    foundUser.snapshot.network.should.be.an.Object()
    foundUser.snapshot.private.should.be.an.Object()
  })
})
