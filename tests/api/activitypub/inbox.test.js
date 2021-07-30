require('should')
const { createUser, createUserOnFediverse } = require('../fixtures/users')
const { createReceiver, makeUrl, startServerWithEmitterAndReceiver } = require('../utils/activitypub')
const { randomActivityId, randomActivity } = require('../utils/activities')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, signedReq } = require('../utils/utils')

describe('activitypub:post:inbox', () => {
  it('should reject without activity id', async () => {
    try {
      const { username } = await createReceiver()
      const body = {}
      const { keyUrl, privateKey } = await startServerWithEmitterAndReceiver()
      const receiverInboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      await signedReq({ keyUrl, url: receiverInboxUrl, privateKey, body })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('missing parameter in body: id')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject without activity type', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const { keyUrl, privateKey } = await startServerWithEmitterAndReceiver({ emitterUser })
      const { username } = await createReceiver()
      const receiverActorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const receiverInboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const body = randomActivity({
        emitterActorUrl: keyUrl,
        activityObject: receiverActorUrl
      })
      delete body.type
      await signedReq({
        url: receiverInboxUrl,
        keyUrl,
        privateKey,
        body,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('missing parameter in body: type')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject if receiver user is not on the fediverse', async () => {
    try {
      const { username: nonFediversableUsername } = await createUser({ fediversable: false })
      const receiverActorUrl = makeUrl({ params: { action: 'actor', name: nonFediversableUsername } })
      const receiverInboxUrl = makeUrl({ params: { action: 'inbox', name: nonFediversableUsername } })
      const { keyUrl, privateKey } = await startServerWithEmitterAndReceiver()
      const body = randomActivity({
        emitterActorUrl: keyUrl,
        activityObject: receiverActorUrl
      })

      await signedReq({
        privateKey,
        url: receiverInboxUrl,
        keyUrl,
        body
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('user is not on the fediverse')
      parsedBody.status.should.equal(404)
    }
  })

  it('should create an activity', async () => {
    const { username } = await createReceiver()
    const receiverActorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const receiverInboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const { keyUrl, privateKey } = await startServerWithEmitterAndReceiver()
    const externalId = randomActivityId()
    const body = randomActivity({
      externalId,
      emitterActorUrl: keyUrl,
      activityObject: receiverActorUrl
    })
    const res = await signedReq({
      url: receiverInboxUrl,
      keyUrl,
      privateKey,
      body,
    })
    res.statusCode.should.equal(200)
    const parsedBody = JSON.parse(res.body)
    parsedBody['@context'].should.containEql('https://www.w3.org/ns/activitystreams')
    parsedBody.type.should.equal('Accept')
    parsedBody.object.should.equal(receiverActorUrl)
    parsedBody.actor.should.equal(keyUrl)
    parsedBody.id.should.equal(externalId)
  })
})
