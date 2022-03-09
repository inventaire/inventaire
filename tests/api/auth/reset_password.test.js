require('should')
const { shouldNotBeCalled } = require('tests/unit/utils')
const { publicReq, getUser } = require('../utils/utils')
const endpoint = '/api/auth?action=reset-password'

describe('auth:reset-password', () => {
  it('should reject requests without email', async () => {
    await publicReq('post', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: email')
    })
  })

  it('should reject invalid email', async () => {
    const invalidEmail = 'foo'
    await publicReq('post', endpoint, { email: invalidEmail })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid email')
    })
  })

  it('should reject inexistant email', async () => {
    const wrongEmail = 'validBut@wrongEmail.org'
    await publicReq('post', endpoint, { email: wrongEmail })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('email not found')
    })
  })

  it('should send a reset password email', async () => {
    const user = await getUser()
    const res = await publicReq('post', endpoint, { email: user.email })
    res.ok.should.be.true()
  })
})
