const { shouldNotBeCalled } = require('../utils/utils')
const { bearerTokenReq } = require('../utils/request')
const { getToken } = require('../utils/oauth')
const randomString = require('lib/utils/random_string')
const { parseSessionCookies, parseBase64EncodedJson } = require('../utils/auth')

describe('oauth:authenticate', () => {
  it('should accept a request authentified by a bearer token', async () => {
    const token = await getToken({ scope: [ 'email', 'username' ] })
    const res = await bearerTokenReq(token, 'get', '/api/user')
    res.statusCode.should.equal(200)
  })

  it('should reject a request with an unauthorized method', async () => {
    const token = await getToken({ scope: [ 'username' ] })
    await bearerTokenReq(token, 'put', '/api/user', {
      attribute: 'bio',
      value: randomString(10)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('this resource can not be accessed with an OAuth bearer token')
    })
  })

  it('should reject a request with an unauthorized endpoint', async () => {
    const token = await getToken({ scope: [ 'username' ] })
    await bearerTokenReq(token, 'get', '/api/foo')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('this resource can not be accessed with an OAuth bearer token')
    })
  })

  // Ideally, we should not return any 'Set-Cookie' header at all
  // to not give the false impression that those cookies have any interest
  it('should not return authentified session cookies', async () => {
    const token = await getToken({ scope: [ 'username' ] })
    const res = await bearerTokenReq(token, 'get', '/api/user')
    const [ sessionCookie ] = parseSessionCookies(res.headers['set-cookie'])
    parseBase64EncodedJson(sessionCookie).passport.should.deepEqual({})
  })
})
