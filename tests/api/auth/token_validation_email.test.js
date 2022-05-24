const CONFIG = require('config')
const host = CONFIG.getPublicOrigin()
require('should')
const { getUserGetter, publicReq, shouldNotBeCalled } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { wait } = require('lib/promises')
const { createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = require('lib/doc_updates')
const db = require('db/couchdb/base')('users')
const endpoint = '/api/token?action=validation-email'
const randomString = require('lib/utils/random_string')

describe('token:validation-email', () => {
  it('should reject requests without email', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('missing_email')
    })
  })

  it('should reject requests without token', async () => {
    const email = createUserEmail()
    await publicReq('get', `${endpoint}&email=${email}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('missing_token')
    })
  })

  it('should reject if token is too short', async () => {
    const email = createUserEmail()
    const token = randomString(31)
    await getUserGetter(email)()
    await publicReq('get', `${endpoint}&email=${email}&token=${token}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid token length')
    })
  })

  it('should reject if account is already validated', async () => {
    const email = createUserEmail()
    const token = randomString(32)
    const user = await getUserGetter(email)()
    await db.update(user._id, BasicUpdater('validEmail', true))
    await wait(100)
    const { headers } = await rawRequest('get', `${host}${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })

  it('should reject if invalid token', async () => {
    const email = createUserEmail()
    const token = randomString(32)
    const userPromise = getUserGetter(email)()
    await userPromise
    const { headers } = await rawRequest('get', `${host}${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })
})
