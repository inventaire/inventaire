const __ = require('config').universalPath
const { publicReq, authReq, rawAuthReq, shouldNotBeCalled } = require('../utils/utils')
const { getClient } = require('../utils/oauth')
const randomString = __.require('lib', 'utils/random_string')
const endpoint = '/api/oauth/authorize'
const { parse: parseQuery } = require('querystring')

describe('oauth:authorize', () => {
  it('should reject unauthentified requests', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should reject without a client id', async () => {
    await authReq('get', `${endpoint}?scope=username`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Missing parameter: `client_id`')
    })
  })

  it('should reject without a state', async () => {
    const { _id: clientId } = await getClient()
    await authReq('get', `${endpoint}?client_id=${clientId}&scope=username`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Missing parameter: `state`')
    })
  })

  it('should reject without a response_type', async () => {
    const { _id: clientId } = await getClient()
    await authReq('get', `${endpoint}?client_id=${clientId}&state=${randomString(20)}&scope=username`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('Missing parameter: `response_type`')
    })
  })

  // Particularity: oauth2-server doesn't check the presence of scope,
  // so we have to validate it ourselves, thus this the error is in the Inventaire error format
  it('should reject without a scope', async () => {
    const { _id: clientId } = await getClient()
    await authReq('get', `${endpoint}?client_id=${clientId}&state=${randomString(20)}&response_type=code`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: scope')
    })
  })

  it('should reject when passed an invalid client id', async () => {
    await authReq('get', `${endpoint}?client_id=foo&state=${randomString(20)}&response_type=code&scope=username`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('unknown client')
    })
  })

  it('should reject when passed an invalid response_type', async () => {
    const { _id: clientId } = await getClient()
    await authReq('get', `${endpoint}?client_id=${clientId}&state=${randomString(20)}&response_type=foo&scope=username`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('Unsupported response type')
    })
  })

  it('should redirect to the client redirect uri', async () => {
    const { _id: clientId, redirectUris } = await getClient()
    const state = randomString(20)
    const url = `${endpoint}?client_id=${clientId}&state=${state}&response_type=code&scope=username`
    const { statusCode, headers } = await rawAuthReq('get', url)
    statusCode.should.equal(302)
    const { location } = headers
    const [ pathname, query ] = location.split('?')
    pathname.should.equal(redirectUris[0])
    const { code, state: returnedState } = parseQuery(query)
    code.should.be.a.String()
    returnedState.should.equal(state)
  })

  // oauth2-server doesn't do scope validation during authorization
  // xit('should reject invalid scope', async () => {})
})
