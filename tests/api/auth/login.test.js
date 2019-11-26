const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { nonAuthReq } = require('../utils/utils')
const endpoint = '/api/auth?action=login'
const randomString = __.require('lib', './utils/random_string')
const { createUser, createUsername } = require('../fixtures/users')

describe('auth:login', () => {
  it('should login a user', done => {
    const username = createUsername()
    const password = '12345678' // as defined in "fixtures/users"
    createUser({ username })
    .delay(10)
    .then(user => {
      nonAuthReq('post', endpoint, {
        username,
        email: user.email,
        password
      })
      .then(res => {
        res.ok.should.be.true()
        done()
      })
      .catch(done)
    })
  })

  it('should reject wrong password', done => {
    const username = createUsername()
    const password = randomString(9)
    createUser({ username })
    .delay(10)
    .then(user => {
      nonAuthReq('post', endpoint, { username, password })
      .catch(err => {
        err.statusMessage.should.equal('Unauthorized')
        // TODO serve better handdled error
        // err.body.status_verbose.should.equal('unauthorized user')
        done()
      })
      .catch(done)
    })
  })
})
