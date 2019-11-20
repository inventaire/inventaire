
const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')
const { createUser } = require('../fixtures/users')
const randomString = __.require('lib', './utils/random_string')

describe('users:by-usernames', () => it('should get a user with a non lowercase username', done => {
  let username = `notAllLowerCase${randomString(4)}`
  const lowerCasedUsername = username.toLowerCase()
  createUser({ username })
  .delay(10)
  .then(user => {
    ({ username } = user)
    return nonAuthReq('get', `/api/users?action=by-usernames&usernames=${username}`)
    .then(res => {
      const { users } = res
      users.should.be.an.Object()
      should(users[username]).not.be.ok()
      users[lowerCasedUsername].should.be.an.Object()
      users[lowerCasedUsername].username.should.equal(username)
      done()
    })
  })
  .catch(undesiredErr(done))
}))
