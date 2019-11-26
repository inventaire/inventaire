const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, getUser } = require('../utils/utils')
const randomString = __.require('lib', 'utils/random_string')
const endpoint = '/api/auth?action=update-password'
const { createUser, createUserEmail } = require('../fixtures/users')

describe('auth:update-password', () => {
  it('should reject short new password', done => {
    getUser()
    .then(user => {
      authReq('post', endpoint, {
        email: user.email,
        'new-password': randomString(7)
      })
      .catch(err => {
        err.body.status_verbose.should.startWith('invalid new-password')
        done()
      })
    })
    .catch(done)
  })

  it('should reject short old password', done => {
    authReq('post', endpoint, {
      email: createUserEmail(),
      'new-password': randomString(20),
      'current-password': randomString(7)
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
      done()
    })
    .catch(done)
  })

  it('should reject if current password is incorrect', done => {
    createUser()
    .then(user => {
      authReq('post', endpoint, {
        email: user.email,
        'current-password': randomString(20),
        'new-password': randomString(20)
      })
      .catch(err => {
        err.body.status_verbose.should.startWith('invalid current-password')
        done()
      })
    })
    .catch(done)
  })
})
