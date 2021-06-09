const _ = require('builders/utils')
const CONFIG = require('config')
require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { query, startServerWithEmetterAndReceiver, startServerWithEmetterUser, createReceiver, makeUrl, actorSignReq } = require('../utils/activity_pub')
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
      const emetterUser = await createUserOnFediverse()
      delete emetterUser.publicKey
      const { receiverUrl, emetterUrl } = await startServerWithEmetterAndReceiver({ emetterUser })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
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
      const emetterUser = await createUserOnFediverse()
      emetterUser.publicKey = 'foo'
      const { receiverUrl, emetterUrl } = await startServerWithEmetterAndReceiver({ emetterUser })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
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
      const emetterUser = await createUserOnFediverse()
      const anotherUser = await createUserOnFediverse()
      emetterUser.privateKey = anotherUser.privateKey
      const { receiverUrl, emetterUrl } = await startServerWithEmetterAndReceiver({ emetterUser })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('signature verification failed')
    }
  })

  it('should verify request', async () => {
    const emetterUser = await createUserOnFediverse()
    const { receiverUrl, emetterUrl } = await startServerWithEmetterAndReceiver({ emetterUser })
    const res = await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
  })

  it('should verify signatures with different headers', async () => {
    const emetterUser = await createUserOnFediverse()
    const { origin, query } = await startServerWithEmetterUser({ emetterUser })
    const emetterUrl = origin.concat(query)
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
    const { privateKey } = emetterUser
    const signature = sign(_.extend({
      headers: signatureHeadersInfo,
      method,
      keyUrl: emetterUrl,
      privateKey,
      endpoint
    }, signatureHeaders))
    const headers = _.extend({ signature }, signatureHeaders)
    const res = await rawRequest(method, receiverUrl, { headers })
    res.statusCode.should.equal(200)
  })
})
