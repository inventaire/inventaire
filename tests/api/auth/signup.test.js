require('should')
const { publicReq, undesiredRes } = require('../utils/utils')
const { Wait } = require('lib/promises')
const endpoint = '/api/auth?action=signup'
const randomString = require('lib/utils/random_string')
const { createUser, createUsername } = require('../fixtures/users')

describe('auth:signup', () => {
  it('should reject requests without username', done => {
    publicReq('post', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: username')
      done()
    })
    .catch(done)
  })

  it('should reject requests without email', done => {
    publicReq('post', endpoint, { username: randomString(4) })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: email')
      done()
    })
    .catch(done)
  })

  it('should reject requests without password', done => {
    publicReq('post', endpoint, {
      username: randomString(4),
      email: `bla${randomString(4)}@foo.bar`
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: password')
      done()
    })
    .catch(done)
  })

  it('should create a user', done => {
    publicReq('post', endpoint, {
      username: randomString(4),
      email: `bla${randomString(4)}@foo.bar`,
      password: randomString(8)
    })
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })
})

describe('auth:username-availability', () => {
  it('should reject an account with already created username', done => {
    const username = createUsername()
    createUser({ username })
    .then(Wait(10))
    .then(user => {
      return publicReq('post', endpoint, {
        username,
        email: `bla${username}@foo.bar`,
        password: randomString(8)
      })
    })
    .catch(err => {
      err.body.status_verbose.should.equal('an account is already in the process of being created with this username')
      done()
    })
    .catch(done)
  })
})
