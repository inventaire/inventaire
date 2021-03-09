require('should')
const { authReq, customAuthReq, getUser, getUserGetter } = require('../utils/utils')
const randomString = require('lib/utils/random_string')
const { Wait } = require('lib/promises')
const endpoint = '/api/auth?action=update-password'
const { createUser, createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = require('lib/doc_updates')
const db = require('db/couchdb/base')('users')

describe('auth:update-password', () => {
  it('should reject short new password', done => {
    getUser()
    .then(user => {
      return authReq('post', endpoint, {
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
      return authReq('post', endpoint, {
        email: user.email,
        'current-password': randomString(20),
        'new-password': randomString(20)
      })
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
      done()
    })
    .catch(done)
  })

  it('should reject if reset password timestamp is invalid', done => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email)()
    updateCustomUser(userPromise, 'resetPassword', 'invalid')
    .then(() => {
      return customAuthReq(userPromise, 'post', endpoint, {
        email,
        'new-password': randomString(20)
      })
    })
    .catch(err => {
      err.body.status_verbose.should.equal('invalid resetPassword timestamp')
      done()
    })
    .catch(done)
  })

  it('should reject if reset password timestamp is too old', done => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email)()
    updateCustomUser(userPromise, 'resetPassword', 1000)
    .then(() => {
      return customAuthReq(userPromise, 'post', endpoint, {
        email,
        'new-password': randomString(20)
      })
    })
    .catch(err => {
      err.body.status_verbose.should.equal('reset password timespan experied')
      done()
    })
    .catch(done)
  })

  it('should reset password timestamp is recent', done => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email)()
    const recentTime = Date.now() - 1000
    updateCustomUser(userPromise, 'resetPassword', recentTime)
    .then(() => {
      return customAuthReq(userPromise, 'post', endpoint, {
        email,
        'new-password': randomString(20)
      })
    })
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })
})

const updateCustomUser = (userPromise, userAttribute, value) => {
  return userPromise
  .then(user => {
    db.update(user._id, BasicUpdater(userAttribute, value))
  })
  .then(Wait(100))
}
