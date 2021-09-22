require('should')
const { createUser, createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { makeUrl, createActivity, createRemoteActivityPubServerUser } = require('../utils/activitypub')
const { getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const { wait } = require('lib/promises')

describe('activitypub:post:inbox', () => {
  it('should reject without activity id in body', async () => {
    try {
      const { username } = await createUsername()
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      await signedReq({
        url: inboxUrl,
        body: {}
      })
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
      const { username } = await createUsername()
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const body = createActivity()
      delete body.type
      await signedReq({
        url: inboxUrl,
        body
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('missing parameter in body: type')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject without an activity object', async () => {
    try {
      const { username } = await createUsername()
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      await signedReq({
        url: inboxUrl
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('missing parameter in body: object')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject with an invalid activity object', async () => {
    try {
      const { username } = await createUser({ fediversable: false })
      const actorUrl = 'invalidActorUrl'
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      await signedReq({
        object: actorUrl,
        url: inboxUrl
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.startWith('invalid object')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject if user is not on the fediverse', async () => {
    try {
      const { username } = await createUser({ fediversable: false })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      await signedReq({
        object: actorUrl,
        url: inboxUrl
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('user is not on the fediverse')
      parsedBody.status.should.equal(404)
    }
  })

  it('should return a valid response', async () => {
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const res = await signedReq({
      object: actorUrl,
      url: inboxUrl
    })
    res.statusCode.should.equal(200)
  })
})

describe('activitypub:follow', () => {
  it('should create a follow activity', async () => {
    const emitterUser = await createRemoteActivityPubServerUser()
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    await signedReq({
      emitterUser,
      object: actorUrl,
      url: inboxUrl
    })
    const activities = await getFollowActivitiesByObject(username)
    activities.length.should.equal(1)
  })

  it('should not recreate a follow activity if actor is already following someone', async () => {
    const emitterUser = await createRemoteActivityPubServerUser()
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const requestPromise = signedReq({
      emitterUser,
      object: actorUrl,
      url: inboxUrl
    })
    await requestPromise
    await wait(500)
    await requestPromise
    const activities = await getFollowActivitiesByObject(username)
    activities.length.should.equal(1)
  })
})
