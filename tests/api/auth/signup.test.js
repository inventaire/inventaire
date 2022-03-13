require('should')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/auth?action=signup'
const randomString = require('lib/utils/random_string')
const { createUser, createUsername } = require('../fixtures/users')

describe('auth:signup', () => {
  it('should reject requests without username', async () => {
    await publicReq('post', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: username')
    })
  })

  it('should reject requests without email', async () => {
    await publicReq('post', endpoint, { username: randomString(4) })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: email')
    })
  })

  it('should reject requests without password', async () => {
    await publicReq('post', endpoint, {
      username: randomString(4),
      email: `bla${randomString(4)}@foo.bar`
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: password')
    })
  })

  it('should create a user', async () => {
    const res = await signup({
      email: `bla${randomString(4)}@foo.bar`,
    })
    res.ok.should.be.true()
  })

  it('should reject an invalid email', async () => {
    await signup({
      email: `bla${randomString(4)}@foo..bar`
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.error_name.should.equal('invalid_email')
    })
  })
})

describe('auth:username-availability', () => {
  it('should reject an account with an already used username', async () => {
    const username = createUsername()
    await createUser({ username })
    await wait(10)
    await signup({ username })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('an account is already in the process of being created with this username')
    })
  })

  it('should normalize unicode letters', async () => {
    const usernameBase = createUsername()
    const nonNormalizedUnicodeLetter = '\u0065\u0301'
    const nonNormalizedUnicodeUsername = usernameBase + nonNormalizedUnicodeLetter
    const user = await createUser({ username: nonNormalizedUnicodeUsername })
    await wait(10)
    const normalizedUnicodeUsername = usernameBase + nonNormalizedUnicodeLetter.normalize()
    user.username.should.equal(normalizedUnicodeUsername)
    await signup({ username: nonNormalizedUnicodeUsername })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('an account is already in the process of being created with this username')
    })
    await signup({ username: normalizedUnicodeUsername })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('an account is already in the process of being created with this username')
    })
  })
})

const signup = ({ username, email, password }) => {
  return publicReq('post', endpoint, {
    username: username || randomString(8),
    email: email || `bla${randomString(8)}@foo.bar`,
    password: password || randomString(8)
  })
}
