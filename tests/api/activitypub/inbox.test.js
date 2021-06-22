const CONFIG = require('config')
require('should')
const { wait } = require('lib/promises')
const { createUser, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { startServerWithEmitterUser, createReceiver, makeUrl } = require('../utils/activity_pub')
const { getActivityByExternalId, randomActivityId } = require('../utils/activities')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

const endpoint = '/api/activitypub'

const randomActivity = ({ externalId, emitterActorUrl, activityObject, type }) => {
  if (!externalId) externalId = randomActivityId(CONFIG.publicHost)
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: externalId,
    type: type || 'Follow',
    actor: emitterActorUrl,
    object: activityObject
  }
}

const buildReq = async (params = {}) => {
  let { origin, body, emitterUrl: keyUrl, emitterUser, emitterEndpoints } = params
  if (!emitterUser) {
    emitterUser = await createUserOnFediverse()
    const res = await startServerWithEmitterUser({
      emitterUser,
      endpoints: emitterEndpoints
    })
    origin = res.origin
    keyUrl = origin.concat(res.query)
  }
  const privateKey = emitterUser.privateKey
  return { body, keyUrl, privateKey, origin }
}

const inboxSignedReq = async params => {
  const { keyUrl, url, privateKey, body } = params
  return signedReq({ method: 'post', endpoint, url, keyUrl, privateKey, body })
}

describe('activitypub:post:inbox', () => {
  it('should reject without activity id', async () => {
    try {
      const { username } = await createReceiver()
      const body = {}
      const { keyUrl, privateKey } = await buildReq()
      const receiverInboxUrl = makeUrl({ action: 'inbox', username })
      await inboxSignedReq({ keyUrl, url: receiverInboxUrl, privateKey, body })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('missing parameter in body: id')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject without activity type', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmitterUser(emitterUser)
      const emitterActorUrl = origin.concat(query)
      const { username } = await createReceiver()
      const body = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        // id is a unique to each activity minted by the emitter of a request
        // activity creation will be ignored if id is already found
        id: randomActivityId(origin),
      }
      const receiverActorUrl = makeUrl({ action: 'actor', username })
      const { privateKey } = await buildReq({
        origin,
        emitterUser,
        activityObject: receiverActorUrl,
      })

      await inboxSignedReq({
        keyUrl: emitterActorUrl,
        url: makeUrl({ action: 'inbox', username }),
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

  it('should reject if object name is not a fediversable user', async () => {
    try {
      const { username: nonFediversableUsername } = await createUser({ fediversable: false })
      const receiverActorUrl = makeUrl({ action: 'actor', username: nonFediversableUsername })
      const { keyUrl, privateKey } = await buildReq({ activityObject: receiverActorUrl })
      const receiverInboxUrl = makeUrl({ action: 'inbox', username: nonFediversableUsername })
      const body = randomActivity({
        emitterActorUrl: keyUrl,
        activityObject: receiverActorUrl
      })
      await inboxSignedReq({
        keyUrl,
        url: receiverInboxUrl,
        privateKey,
        body
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('forbidden user')
      parsedBody.status.should.equal(403)
    }
  })

  it('should create an activity', async () => {
    const { username } = await createReceiver()
    const receiverActorUrl = makeUrl({ action: 'actor', username })
    const { keyUrl, privateKey, origin } = await buildReq({ activityObject: receiverActorUrl })

    const externalId = randomActivityId(origin)
    const receiverInboxUrl = makeUrl({ action: 'inbox', username })
    const body = randomActivity({
      externalId,
      emitterActorUrl: keyUrl,
      activityObject: receiverActorUrl
    })
    const res = await inboxSignedReq({
      keyUrl,
      url: receiverInboxUrl,
      privateKey,
      body,
    })
    res.statusCode.should.equal(200)
    const parsedBody = JSON.parse(res.body)
    parsedBody.type.should.equal('Accept')
    await wait(50)
    const newActivity = await getActivityByExternalId(externalId)
    newActivity.externalId.should.equal(externalId)
  })
})
