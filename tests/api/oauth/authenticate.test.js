const __ = require('config').universalPath
const { shouldNotBeCalled } = require('../utils/utils')
const { bearerTokenReq } = require('../utils/request')
const { getToken } = require('../utils/oauth')
const randomString = __.require('lib', 'utils/random_string')

describe('oauth:authenticate', () => {
  it('should reject a request authentified by a bearer token with a non existing scope', async () => {
    const token = await getToken({ scope: [ 'foo' ] })
    await bearerTokenReq(token, 'get', '/api/user')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('Insufficient scope: authorized scope is insufficient')
    })
  })

  it('should accept a request authentified by a bearer token', async () => {
    const token = await getToken({ scope: [ 'profile' ] })
    const res = await bearerTokenReq(token, 'get', '/api/user')
    res.statusCode.should.equal(200)
  })

  it('should accept a request authentified by a bearer token with several scopes', async () => {
    const token = await getToken({ scope: [ 'foo', 'profile' ] })
    const res = await bearerTokenReq(token, 'get', '/api/user')
    res.statusCode.should.equal(200)
  })

  it('should reject a request to a resource out of the token scope', async () => {
    const token = await getToken({ scope: [ 'profile' ] })
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
})
