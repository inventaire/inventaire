const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
require('should')
const { publicReq, undesiredRes } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { createUserEmail } = require('../fixtures/users')
const endpoint = '/api/token?action=reset-password'
const randomString = require('lib/utils/random_string')

describe('token:reset-password', () => {
  it('should reject requests without email', done => {
    publicReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: email')
      done()
    })
    .catch(done)
  })

  it('should reject requests without token', done => {
    const email = createUserEmail()
    publicReq('get', `${endpoint}&email=${email}`)
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

    publicReq('get', `${endpoint}&email=${email}&token=${token}`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid token length')
      done()
    })
    .catch(done)
  })

  it('should reject random token', async () => {
    const email = createUserEmail()
    const token = randomString(32)
    const { headers } = await rawRequest('get', `${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/login/forgot-password?resetPasswordFail=true`)
  })
})
