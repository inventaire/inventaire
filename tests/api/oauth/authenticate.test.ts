import { getRandomString } from '#lib/utils/random_string'
import { parseSessionCookies, parseBase64EncodedJson } from '#tests/api/utils/auth'
import { getToken } from '#tests/api/utils/oauth'
import { bearerTokenReq } from '#tests/api/utils/request'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

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
      value: getRandomString(10),
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
