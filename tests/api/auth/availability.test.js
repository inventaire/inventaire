require('should')
const { publicReq } = require('../utils/utils')
const { wait } = require('lib/promises')
const usernameEndpoint = '/api/auth?action=username-availability'
const emailEndpoint = '/api/auth?action=email-availability'
const { createUser, createUsername } = require('../fixtures/users')
const { shouldNotBeCalled } = require('tests/unit/utils')

describe('auth:username-availability', () => {
  it('should reject requests without username', async () => {
    await publicReq('get', usernameEndpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: username')
    })
  })

  it('should reject an account with already created username', async () => {
    const username = createUsername()
    await createUser({ username })
    await wait(10)
    await publicReq('get', `${usernameEndpoint}&username=${username}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('this username is already used')
    })
  })

  it('should reject an account with reverved words as username', async () => {
    await publicReq('get', `${usernameEndpoint}&username=wikidata`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("reserved words can't be usernames")
    })
  })
})

describe('auth:email-availability', () => {
  it('should reject requests without email', async () => {
    await publicReq('get', emailEndpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: email')
    })
  })

  it('should reject an account with already created email', async () => {
    const user = await createUser()
    await wait(10)
    await publicReq('get', `${emailEndpoint}&email=${user.email}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('this email is already used')
    })
  })
})
