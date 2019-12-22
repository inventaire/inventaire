const CONFIG = require('config')
const __ = CONFIG.universalPath
const host = CONFIG.fullHost()
require('should')
const { nonAuthReq, undesiredRes } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { createUserEmail } = require('../fixtures/users')
const endpoint = '/api/token?action=reset-password'
const randomString = __.require('lib', 'utils/random_string')

describe('token:reset-password', () => {
  it('should reject requests without email', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: email')
      done()
    })
    .catch(done)
  })

  it('should reject requests without token', done => {
    const email = createUserEmail()
    nonAuthReq('get', `${endpoint}&email=${email}`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: token')
      done()
    })
    .catch(done)
  })

  it('should reject requests with too short token', done => {
    const email = createUserEmail()
    const token = randomString(31)

    nonAuthReq('get', `${endpoint}&email=${email}&token=${token}`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid token length')
      done()
    })
    .catch(done)
  })

  it('should reject random token', done => {
    const email = createUserEmail()
    const token = randomString(32)
    rawRequest('get', {
      url: `${host}${endpoint}&email=${email}&token=${token}`,
      followRedirect: false
    })
    .then(res => {
      res.headers.location.should.equal('/login/forgot-password?resetPasswordFail=true')
      done()
    })
    .catch(done)
  })
})
