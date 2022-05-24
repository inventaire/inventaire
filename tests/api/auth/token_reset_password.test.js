const CONFIG = require('config')
const host = CONFIG.getPublicOrigin()
require('should')
const { publicReq } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { createUserEmail } = require('../fixtures/users')
const endpoint = '/api/token?action=reset-password'
const randomString = require('lib/utils/random_string')
const { shouldNotBeCalled } = require('tests/unit/utils')

describe('token:reset-password', () => {
  it('should reject requests without email', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: email')
    })
  })

  it('should reject requests without token', async () => {
    const email = createUserEmail()
    await publicReq('get', `${endpoint}&email=${email}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: token')
    })
  })

  it('should reject requests with too short token', async () => {
    const email = createUserEmail()
    const token = randomString(31)

    await publicReq('get', `${endpoint}&email=${email}&token=${token}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid token length')
    })
  })

  it('should reject random token', async () => {
    const email = createUserEmail()
    const token = randomString(32)
    const { headers } = await rawRequest('get', `${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/login/forgot-password?resetPasswordFail=true`)
  })
})
