const _ = require('builders/utils')
const CONFIG = require('config')
require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { query, startServerWithEmitterAndReceiver, startServerWithEmitterUser, createReceiver, makeUrl, actorSignReq } = require('../utils/activity_pub')
const { rawRequest } = require('../utils/request')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { sign } = require('controllers/activitypub/lib/security')

const endpoint = '/api/activitypub'

describe('activitypub:signed:request', () => {
  it('should reject unsigned request', async () => {
    try {
      const receiverUsername = createUsername()
      await rawRequest('get', query({ action: 'actor', username: receiverUsername }), {
        headers: {
          'content-type': 'application/activity+json'
        }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('no signature header')
    }
  })

  it('should reject when no publicKey is found', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      delete emitterUser.publicKey
      const { receiverUrl, emitterUrl } = await startServerWithEmitterAndReceiver({ emitterUser })
      await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('no publicKeyPem found')
    }
  })

  it('should reject when fetching an invalid publicKey', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      emitterUser.publicKey = 'foo'
      const { receiverUrl, emitterUrl } = await startServerWithEmitterAndReceiver({ emitterUser })
      await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('invalid publicKeyPem found')
    }
  })

  it('should reject when key verification fails', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const anotherUser = await createUserOnFediverse()
      emitterUser.privateKey = anotherUser.privateKey
      const { receiverUrl, emitterUrl } = await startServerWithEmitterAndReceiver({ emitterUser })
      await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('signature verification failed')
    }
  })

  it('should reject if date header is more than 30 seconds old', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const { receiverUrl, emitterUrl } = await startServerWithEmitterAndReceiver({ emitterUser })
      const now = new Date()
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toUTCString()
      const publicHost = CONFIG.host
      const signatureHeaders = {
        host: publicHost,
        date: thirtySecondsAgo
      }
      const signatureHeadersInfo = `(request-target) ${Object.keys(signatureHeaders).join(' ')}`
      const method = 'get'
      const signature = sign(_.extend({
        headers: signatureHeadersInfo,
        method,
        keyUrl: emitterUrl,
        privateKey: emitterUser.privateKey,
        endpoint
      }, signatureHeaders))
      const headers = _.extend({ signature }, signatureHeaders)
      const params = { headers }

      await rawRequest(method, receiverUrl, params)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('outdated request')
    }
  })

  it('should verify request', async () => {
    const emitterUser = await createUserOnFediverse()
    const { receiverUrl, emitterUrl } = await startServerWithEmitterAndReceiver({ emitterUser })
    const res = await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
  })

  it('should verify signatures with different headers', async () => {
    const emitterUser = await createUserOnFediverse()
    const { origin, query } = await startServerWithEmitterUser({ emitterUser })
    const emitterUrl = origin.concat(query)
    const { username } = await createReceiver()
    const receiverUrl = makeUrl({ action: 'actor', username })
    const date = (new Date()).toUTCString()
    const host = CONFIG.host
    const method = 'get'
    const signatureHeaders = {
      host,
      date,
      'content-type': 'application/xml',
    }
    const signatureHeadersInfo = `(request-target) ${Object.keys(signatureHeaders).join(' ')}`
    const { privateKey } = emitterUser
    const signature = sign(_.extend({
      headers: signatureHeadersInfo,
      method,
      keyUrl: emitterUrl,
      privateKey,
      endpoint
    }, signatureHeaders))
    const headers = _.extend({ signature }, signatureHeaders)
    const res = await rawRequest(method, receiverUrl, { headers })
    res.statusCode.should.equal(200)
  })
})
