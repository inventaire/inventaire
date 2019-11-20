
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
