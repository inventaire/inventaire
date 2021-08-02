const _ = require('builders/utils')
const CONFIG = require('config')
require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { startServerWithEmitterAndReceiver, makeUrl } = require('../utils/activitypub')
const { rawRequest } = require('../utils/request')
const { randomActivity } = require('../utils/activities')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, signedReq } = require('../utils/utils')
const { sign } = require('controllers/activitypub/lib/security')

const endpoint = '/api/activitypub'

const inboxReq = async emitterUser => {
  const { keyUrl, receiverUsername } = await startServerWithEmitterAndReceiver({ emitterUser })
  const inboxUrl = makeUrl({ params: { action: 'inbox', name: receiverUsername } })
  const actorUrl = makeUrl({ params: { action: 'actor', name: receiverUsername } })
  const body = randomActivity({
    emitterActorUrl: actorUrl,
    activityObject: actorUrl
  })
  return signedReq({ url: inboxUrl, keyUrl, privateKey: emitterUser.privateKey, body })
}

describe('activitypub:signed:request', () => {
  it('should reject unsigned request', async () => {
    try {
      const username = createUsername()
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const body = randomActivity({
        emitterActorUrl: actorUrl,
        activityObject: actorUrl
      })
      await rawRequest('post', inboxUrl, {
        headers: {
          'content-type': 'application/activity+json'
        },
        body
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
      await inboxReq(emitterUser)
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
      await inboxReq(emitterUser)
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
      await inboxReq(emitterUser)
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
      const { username, keyUrl } = await startServerWithEmitterAndReceiver({ emitterUser })
      const now = new Date()
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toUTCString()
      const publicHost = CONFIG.host
      const signatureHeaders = {
        host: publicHost,
        date: thirtySecondsAgo
      }
      const signatureHeadersInfo = `(request-target) ${Object.keys(signatureHeaders).join(' ')}`
      const method = 'post'
      const signature = sign(_.extend({
        headers: signatureHeadersInfo,
        method,
        keyUrl,
        privateKey: emitterUser.privateKey,
        endpoint
      }, signatureHeaders))
      const headers = _.extend({ signature }, signatureHeaders)
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const body = randomActivity({
        emitterActorUrl: actorUrl,
        activityObject: actorUrl
      })
      await rawRequest(method, inboxUrl, {
        headers,
        body
      })
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
    const res = await inboxReq(emitterUser)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
  })
})
