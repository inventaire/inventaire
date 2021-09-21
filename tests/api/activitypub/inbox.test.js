require('should')
const { createUser, createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { makeUrl, createActivity, createRemoteActivityPubServerUser } = require('../utils/activitypub')
const { getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const { wait } = require('lib/promises')
const requests_ = require('lib/requests')

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

describe('activitypub:Follow', () => {
  it('should create a Follow activity', async () => {
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

  it('should not recreate a Follow activity if actor is already following someone', async () => {
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

  it('should trigger an Accept activity', async () => {
    const emitterUser = await createRemoteActivityPubServerUser()
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const { remoteHost } = await signedReq({
      emitterUser,
      object: actorUrl,
      url: inboxUrl
    })
    const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${username}`)
    inbox.length.should.equal(1)
    const activity = inbox[0]
    activity['@context'].should.deepEqual([ 'https://www.w3.org/ns/activitystreams' ])
    activity.type.should.equal('Accept')
    activity.actor.should.equal(actorUrl)
    activity.object.should.startWith(remoteHost)
  })
})

describe('activitypub:Undo', () => {
  it('should repond ok if already not following', async () => {
    const { username } = await createUserOnFediverse()
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const emitterUser = await createRemoteActivityPubServerUser()
    const res = await signedReq({
      emitterUser,
      url: inboxUrl,
      type: 'Undo',
      object: 'foo',
    })
    res.statusCode.should.equal(200)
  })

  it('should reject to undo from another actor', async () => {
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const emitterUserA = await createRemoteActivityPubServerUser()
    const emitterUserB = await createRemoteActivityPubServerUser()
    await signedReq({
      emitterUser: emitterUserA,
      object: actorUrl,
      url: inboxUrl
    })
    const activities = await getFollowActivitiesByObject(username)
    const activity = activities[0]
    await signedReq({
      emitterUser: emitterUserB,
      url: inboxUrl,
      type: 'Undo',
      object: activity.externalId,
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  it('should delete activity', async () => {
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const emitterUser = await createRemoteActivityPubServerUser()
    await signedReq({
      emitterUser,
      object: actorUrl,
      url: inboxUrl
    })
    const activities = await getFollowActivitiesByObject(username)
    const activity = activities[0]
    await signedReq({
      emitterUser,
      url: inboxUrl,
      type: 'Undo',
      object: activity.externalId,
    })
    await wait(500)
    const activities2 = await getFollowActivitiesByObject(username)
    activities2.length.should.equal(0)
  })
})
