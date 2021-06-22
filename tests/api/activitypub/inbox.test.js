const CONFIG = require('config')
require('should')
const { wait } = require('lib/promises')
const { createUser, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { startServerWithEmetterUser, createReceiver, makeUrl } = require('../utils/activity_pub')
const { getActivityByExternalId, randomActivityId } = require('../utils/activities')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

const endpoint = '/api/activitypub'

// todo: emetter->emitter

const randomActivity = ({ externalId, emetterActorUrl, activityObject, type }) => {
  if (!externalId) externalId = randomActivityId(CONFIG.publicHost)
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: externalId,
    type: type || 'Follow',
    actor: emetterActorUrl,
    object: activityObject
  }
}

const buildReq = async (params = {}) => {
  let { origin, body, emetterUrl: keyUrl, emetterUser, emetterEndpoints } = params
  if (!emetterUser) {
    emetterUser = await createUserOnFediverse()
    const res = await startServerWithEmetterUser({
      emetterUser,
      endpoints: emetterEndpoints
    })
    origin = res.origin
    keyUrl = origin.concat(res.query)
  }
  const privateKey = emetterUser.privateKey
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
      const emetterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmetterUser(emetterUser)
      const emetterActorUrl = origin.concat(query)
      const { username } = await createReceiver()
      const body = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        // id is a unique to each activity minted by the emetter of a request
        // activity creation will be ignored if id is already found
        id: randomActivityId(origin),
      }
      const receiverActorUrl = makeUrl({ action: 'actor', username })
      const { privateKey } = await buildReq({
        origin,
        emetterUser,
        activityObject: receiverActorUrl,
      })

      await inboxSignedReq({
        keyUrl: emetterActorUrl,
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
        emetterActorUrl: keyUrl,
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
      parsedBody.status_verbose.should.equal('not found')
      parsedBody.status.should.equal(404)
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
      emetterActorUrl: keyUrl,
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
