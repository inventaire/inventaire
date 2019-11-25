require('should')
const { nonAuthReq, undesiredRes, getUser } = require('../utils/utils')
const endpoint = '/api/auth?action=reset-password'

describe('auth:reset-password', () => {
  it('should reject requests without email', done => {
    nonAuthReq('post', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: email')
      done()
    })
    .catch(done)
  })

  it('should reject invalid email', done => {
    const invalidEmail = 'foo'
    nonAuthReq('post', endpoint, { email: invalidEmail })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid email')
      done()
    })
    .catch(done)
  })

  it('should reject inexistant email', done => {
    const wrongEmail = 'validBut@wrongEmail.org'
    nonAuthReq('post', endpoint, { email: wrongEmail })
    .catch(err => {
      err.body.status_verbose.should.startWith('email not found')
      done()
    })
    .catch(done)
  })

  it('should send a reset password email', done => {
    getUser()
    .then(user => nonAuthReq('post', endpoint, { email: user.email }))
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })
})
