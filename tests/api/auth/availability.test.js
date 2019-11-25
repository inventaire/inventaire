require('should')
const { nonAuthReq, undesiredRes } = require('../utils/utils')
const usernameEndpoint = '/api/auth?action=username-availability'
const emailEndpoint = '/api/auth?action=email-availability'
const { createUser, createUsername } = require('../fixtures/users')

describe('auth:username-availability', () => {
  it('should reject requests without username', done => {
    nonAuthReq('get', usernameEndpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: username')
      done()
    })
    .catch(done)
  })

  it('should reject an account with already created username', done => {
    const username = createUsername()
    createUser({ username })
    .delay(10)
    .then(user => {
      nonAuthReq('get', `${usernameEndpoint}&username=${username}`)
      .catch(err => {
        err.body.status_verbose.should.equal('this username is already used')
        done()
      })
    })
    .catch(undesiredRes(done))
  })

  it('should reject an account with reverved words as username', done => {
    nonAuthReq('get', `${usernameEndpoint}&username=wikidata`)
    .catch(err => {
      err.body.status_verbose.should.equal("reserved words can't be usernames")
      done()
    })
    .catch(undesiredRes(done))
  })
})

describe('auth:email-availability', () => {
  it('should reject requests without email', done => {
    nonAuthReq('get', emailEndpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: email')
      done()
    })
    .catch(done)
  })

  it('should reject an account with already created email', done => {
    createUser()
    .delay(10)
    .then(user => {
      nonAuthReq('get', `${emailEndpoint}&email=${user.email}`)
      .catch(err => {
        err.body.status_verbose.should.equal('this email is already used')
        done()
      })
    })
    .catch(undesiredRes(done))
  })
})
