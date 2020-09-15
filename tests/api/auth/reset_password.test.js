require('should')
const { publicReq, undesiredRes, getUser } = require('../utils/utils')
const endpoint = '/api/auth?action=reset-password'

describe('auth:reset-password', () => {
  it('should reject requests without email', done => {
    publicReq('post', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: email')
      done()
    })
    .catch(done)
  })

  it('should reject invalid email', done => {
    const invalidEmail = 'foo'
    publicReq('post', endpoint, { email: invalidEmail })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid email')
      done()
    })
    .catch(done)
  })

  it('should reject inexistant email', done => {
    const wrongEmail = 'validBut@wrongEmail.org'
    publicReq('post', endpoint, { email: wrongEmail })
    .catch(err => {
      err.body.status_verbose.should.startWith('email not found')
      done()
    })
    .catch(done)
  })

  it('should send a reset password email', done => {
    getUser()
    .then(user => publicReq('post', endpoint, { email: user.email }))
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })
})
