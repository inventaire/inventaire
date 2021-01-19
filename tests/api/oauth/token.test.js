const CONFIG = require('config')
const __ = CONFIG.universalPath
const { authorizationCodeLifetimeMs } = CONFIG.oauthServer
const { shouldNotBeCalled } = require('../utils/utils')
const { postUrlencoded } = require('../utils/request')
const { getClient, getClientWithAuthorization } = require('../utils/oauth')
const { wait } = __.require('lib', 'promises')
const post = body => postUrlencoded('/api/oauth/token', body)

describe('oauth:token', () => {
  it('should reject without a client id', async () => {
    const { secret } = await getClient()
    await post({ client_secret: secret })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Invalid client: cannot retrieve client credentials')
    })
  })

  it('should reject without a client secret', async () => {
    const { _id: clientId } = await getClient()
    await post({ client_id: clientId })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Invalid client: cannot retrieve client credentials')
    })
  })

  it('should reject without a grant type', async () => {
    const { _id: clientId, secret } = await getClient()
    await post({ client_id: clientId, client_secret: secret })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Missing parameter: `grant_type`')
    })
  })

  it('should reject without a code', async () => {
    const { _id: clientId, secret } = await getClient()
    await post({ client_id: clientId, client_secret: secret, grant_type: 'authorization_code' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Missing parameter: `code`')
    })
  })

  it('should reject without a redirect_uri', async () => {
    const { _id: clientId, secret, code } = await getClientWithAuthorization()
    await post({ client_id: clientId, client_secret: secret, grant_type: 'authorization_code', code })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Invalid request: `redirect_uri` is not a valid URI')
    })
  })

  it('should obtain a token', async () => {
    const { _id: clientId, secret, code, redirectUris, scope } = await getClientWithAuthorization()
    const { body } = await post({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUris[0],
    })
    body.access_token.should.be.a.String()
    body.access_token.should.match(/^[0-9a-f]{40}$/)
    body.token_type.should.equal('Bearer')
    body.expires_in.should.be.a.Number()
    body.refresh_token.should.be.a.String()
    body.refresh_token.should.match(/^[0-9a-f]{40}$/)
    body.scope.should.deepEqual(scope)
  })

  it('should reject when the authorization expired', async () => {
    const { _id: clientId, secret, code, redirectUris } = await getClientWithAuthorization()
    await wait(authorizationCodeLifetimeMs + 10)
    await post({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUris[0],
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Invalid grant: authorization code has expired')
    })
  })

  it('should reject when the authorization has already been used', async () => {
    const { _id: clientId, secret, code, redirectUris } = await getClientWithAuthorization()
    const res = await post({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUris[0],
    })
    res.statusCode.should.equal(200)
    await post({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUris[0],
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Invalid grant: authorization code is invalid')
    })
  })
})
