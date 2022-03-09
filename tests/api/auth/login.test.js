require('should')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/auth?action=login'
const randomString = require('lib/utils/random_string')
const { createUser, createUsername } = require('../fixtures/users')

describe('auth:login', () => {
  it('should login a user with a username and a password', async () => {
    const username = createUsername()
    const password = '12345678' // as defined in "fixtures/users"
    await createUser({ username })
    await wait(10)
    const res = await publicReq('post', endpoint, { username, password })
    res.ok.should.be.true()
  })

  it('should login a user with a email and a password', async () => {
    const username = createUsername()
    const password = '12345678' // as defined in "fixtures/users"
    const user = await createUser({ username })
    await wait(10)
    const res = await publicReq('post', endpoint, { username: user.email, password })
    res.ok.should.be.true()
  })

  it('should reject wrong password', async () => {
    const username = createUsername()
    const password = randomString(9)
    await createUser({ username })
    await wait(10)
    await publicReq('post', endpoint, { username, password })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
      // TODO serve better handled errors
      // err.body.status_verbose.should.equal('unauthorized user')
    })
  })
})
