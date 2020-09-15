const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { publicReq } = require('../utils/utils')
const { Wait } = __.require('lib', 'promises')
const endpoint = '/api/auth?action=login'
const randomString = __.require('lib', './utils/random_string')
const { createUser, createUsername } = require('../fixtures/users')

describe('auth:login', () => {
  it('should login a user with a username and a password', done => {
    const username = createUsername()
    const password = '12345678' // as defined in "fixtures/users"
    createUser({ username })
    .then(Wait(10))
    .then(user => publicReq('post', endpoint, { username, password }))
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })

  it('should login a user with a email and a password', done => {
    const username = createUsername()
    const password = '12345678' // as defined in "fixtures/users"
    createUser({ username })
    .then(Wait(10))
    .then(user => publicReq('post', endpoint, { username: user.email, password }))
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })

  it('should reject wrong password', done => {
    const username = createUsername()
    const password = randomString(9)
    createUser({ username })
    .then(Wait(10))
    .then(user => publicReq('post', endpoint, { username, password }))
    .catch(err => {
      err.statusCode.should.equal(401)
      // TODO serve better handled errors
      // err.body.status_verbose.should.equal('unauthorized user')
      done()
    })
    .catch(done)
  })
})
