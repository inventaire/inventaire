const _ = require('builders/utils')
const CONFIG = require('config')
require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { query, startServerWithEmetterUser, createReceiver, makeUrl } = require('../utils/activity_pub')
const { rawRequest } = require('../utils/request')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { sign } = require('controllers/activitypub/lib/security')

const endpoint = '/api/activitypub'
const actorSignReq = async (receiverUrl, emetterUrl, privateKey) => {
  return signedReq({
    method: 'get',
    endpoint,
    url: receiverUrl,
    keyUrl: emetterUrl,
    privateKey
  })
}

describe('activitypub:actor', () => {
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
      const emetterUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverUrl = makeUrl({ action: 'actor', username })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('no publicKeyPem found')
    }
  })

  it('should reject when fetching an invalid publicKey', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      emetterUser.publicKey = 'foo'
      const emetterUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverUrl = makeUrl({ action: 'actor', username })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('invalid publicKeyPem found')
    }
  })

  it('should reject when key verification fails', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      const anotherUser = await createUserOnFediverse()
      emetterUser.privateKey = anotherUser.privateKey
      const emetterUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverUrl = makeUrl({ action: 'actor', username })
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
    const emetterUrl = await startServerWithEmetterUser(emetterUser)
    const { username } = await createReceiver()
    const receiverUrl = makeUrl({ action: 'actor', username })
    const res = await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
  })

  it('should verify signatures with different headers', async () => {
    const emetterUser = await createUserOnFediverse()
    const emetterUrl = await startServerWithEmetterUser(emetterUser)
    const { privateKey } = emetterUser
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
