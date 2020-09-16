const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { publicReq, authReq, customAuthReq, getUser, getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { createUser } = require('../fixtures/users')
const randomString = __.require('lib', './utils/random_string')
const { getTwoFriends } = require('../fixtures/users')
const { Wait } = __.require('lib', 'promises')

const endpoint = '/api/users?action=by-usernames'

describe('users:by-usernames', () => {
  it('should reject without id', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: usernames')
      err.statusCode.should.equal(400)
    }
  })

  it('should get a user with a non lowercase username', async () => {
    let username = `notAllLowerCase${randomString(4)}`
    const lowerCasedUsername = username.toLowerCase()
    const user = await createUser({ username }).then(Wait(10))
    username = user.username
    const res = await publicReq('get', `${endpoint}&usernames=${username}`)
    const { users } = res
    should(users[username]).not.be.ok()
    users[lowerCasedUsername].username.should.equal(username)
    users[lowerCasedUsername].snapshot.public.should.be.an.Object()
  })

  it('should get semi-private data if user is in network', async () => {
    const [ userA, userB ] = await getTwoFriends()
    const { username } = userA
    const lowerCasedUsername = username.toLowerCase()
    const { users } = await customAuthReq(userB, 'get', `${endpoint}&usernames=${username}`)
    users[lowerCasedUsername].should.be.an.Object()
    users[lowerCasedUsername].username.toLowerCase().should.equal(lowerCasedUsername)
    users[lowerCasedUsername].snapshot.public.should.be.an.Object()
    users[lowerCasedUsername].snapshot.network.should.be.an.Object()
  })

  it('should get private data if requested user is requester', async () => {
    const user = await getUser()
    const { username } = user
    const lowerCasedUsername = username.toLowerCase()
    const { users } = await authReq('get', `${endpoint}&usernames=${username}`)
    users[lowerCasedUsername].should.be.an.Object()
    users[lowerCasedUsername].snapshot.public.should.be.an.Object()
    users[lowerCasedUsername].snapshot.network.should.be.an.Object()
    users[lowerCasedUsername].snapshot.private.should.be.an.Object()
  })

  it('should get several users', async () => {
    const users = await Promise.all([ getUser(), getUserB() ])
    const usernames = users.map(_.property('username'))
    const res = await publicReq('get', `${endpoint}&usernames=${usernames.join('|')}`)
    const lowercasedUsernames = usernames.map(_.toLowerCase)
    _.keys(res.users).should.deepEqual(lowercasedUsernames)
  })
})
