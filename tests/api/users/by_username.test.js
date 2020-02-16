const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { nonAuthReq, authReq, customAuthReq, getUser, getUserB, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { createUser } = require('../fixtures/users')
const randomString = __.require('lib', './utils/random_string')
const { getTwoFriends } = require('../fixtures/users')

const endpoint = '/api/users?action=by-usernames'

describe('users:by-usernames', () => {
  it('should reject without id', async () => {
    try {
      const res = await nonAuthReq('get', endpoint, {})
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: usernames')
      err.statusCode.should.equal(400)
    }
  })

  it('should get a user with a non lowercase username', async () => {
    let username = `notAllLowerCase${randomString(4)}`
    const lowerCasedUsername = username.toLowerCase()
    const user = await createUser({ username }).delay(10)
    username = user.username
    const res = await nonAuthReq('get', `${endpoint}&usernames=${username}`)
    const { users } = res
    should(users[username]).not.be.ok()
    users[lowerCasedUsername].username.should.equal(username)
  })

  it('should get several users', async () => {
    const users = await Promise.all([ getUser(), getUserB() ])
    const usernames = users.map(_.property('username'))
    const res = await nonAuthReq('get', `${endpoint}&usernames=${usernames.join('|')}`)
    const lowercasedUsernames = usernames.map(_.toLowerCase)
    _.keys(res.users).should.deepEqual(lowercasedUsernames)
  })
})
