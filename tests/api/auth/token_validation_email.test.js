const CONFIG = require('config')
const __ = CONFIG.universalPath
const host = CONFIG.fullPublicHost()
require('should')
const { getUserGetter } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { wait } = __.require('lib', 'promises')
const { createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const db = __.require('couch', 'base')('users')
const endpoint = '/api/token?action=validation-email'
const randomString = __.require('lib', 'utils/random_string')

describe('token:validation-email', () => {
  it('should reject requests without email', async () => {
    const { headers } = await rawRequest('get', host + endpoint)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })

  it('should reject requests without token', async () => {
    const email = createUserEmail()
    const { headers } = await rawRequest('get', `${host}${endpoint}&email=${email}`)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })

  it('should reject if token is too short', async () => {
    const email = createUserEmail()
    const token = randomString(31)
    await getUserGetter(email, false)()
    const { headers } = await rawRequest('get', `${host}${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })

  it('should reject if account is already validated', async () => {
    const email = createUserEmail()
    const token = randomString(32)
    const user = await getUserGetter(email, false)()
    await db.update(user._id, BasicUpdater('validEmail', true))
    await wait(100)
    const { headers } = await rawRequest('get', `${host}${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })

  it('should reject if invalid token', async () => {
    const email = createUserEmail()
    const token = randomString(32)
    const userPromise = getUserGetter(email, false)()
    await userPromise
    const { headers } = await rawRequest('get', `${host}${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${host}/?validEmail=false`)
  })
})
