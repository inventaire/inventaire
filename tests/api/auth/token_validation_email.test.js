const CONFIG = require('config')
const __ = CONFIG.universalPath
const host = CONFIG.fullHost()
require('should')
const { getUserGetter } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { Wait } = __.require('lib', 'promises')
const { createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const db = __.require('couch', 'base')('users')
const endpoint = '/api/token?action=validation-email'
const randomString = __.require('lib', 'utils/random_string')

describe('token:validation-email', () => {
  it('should reject requests without email', done => {
    rawRequest('get', {
      url: host + endpoint,
      followRedirect: false
    })
    .then(res => {
      res.headers.location.should.equal('/?validEmail=false')
      done()
    })
    .catch(done)
  })

  it('should reject requests without token', done => {
    const email = createUserEmail()
    rawRequest('get', {
      url: `${host}${endpoint}&email=${email}`,
      followRedirect: false
    })
    .then(res => {
      res.headers.location.should.equal('/?validEmail=false')
      done()
    })
    .catch(done)
  })

  it('should reject if token is too short', done => {
    const email = createUserEmail()
    const token = randomString(31)
    const userPromise = getUserGetter(email, false)()
    userPromise
    .then(() => {
      rawRequest('get', {
        url: `${host}${endpoint}&email=${email}&token=${token}`,
        followRedirect: false
      })
      .then(res => {
        res.headers.location.should.equal('/?validEmail=false')
        done()
      })
    })
    .catch(done)
  })

  it('should reject if account is already validated', done => {
    const email = createUserEmail()
    const token = randomString(32)
    const userPromise = getUserGetter(email, false)()
    userPromise
    .then(user => {
      db.update(user._id, BasicUpdater('validEmail', true))
    })
    .then(Wait(100))
    .then(() => {
      rawRequest('get', {
        url: `${host}${endpoint}&email=${email}&token=${token}`,
        followRedirect: false
      })
      .then(res => {
        res.headers.location.should.equal('/?validEmail=false')
        done()
      })
    })
    .catch(done)
  })

  it('should reject if invalid token', done => {
    const email = createUserEmail()
    const token = randomString(32)
    const userPromise = getUserGetter(email, false)()
    userPromise
    .then(() => {
      rawRequest('get', {
        url: `${host}${endpoint}&email=${email}&token=${token}`,
        followRedirect: false
      })
      .then(res => {
        res.headers.location.should.equal('/?validEmail=false')
        done()
      })
    })
    .catch(done)
  })
})
