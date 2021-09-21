require('should')
const { createUser, createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { makeUrl, createActivity, createRemoteActivityPubServerUser } = require('../utils/activitypub')

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

  describe('follow', () => {
    it('should create a follow activity', async () => {
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

  describe('undo follow', () => {
    it('should reject a request to undo from another actor', async () => {
      const { username } = await createUserOnFediverse()
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const emitterUserA = await createRemoteActivityPubServerUser()
      const emitterUserB = await createRemoteActivityPubServerUser()
      const { body } = await signedReq({
        emitterUser: emitterUserA,
        object: actorUrl,
        url: inboxUrl
      })
      const activity = JSON.parse(body)
      await signedReq({
        emitterUser: emitterUserB,
        url: inboxUrl,
        type: 'Undo',
        object: activity.id,
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should undo a follow activity', async () => {
      const { username } = await createUserOnFediverse()
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const emitterUser = await createRemoteActivityPubServerUser()
      const { body } = await signedReq({
        emitterUser,
        object: actorUrl,
        url: inboxUrl
      })
      const activity = JSON.parse(body)
      await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: activity.id,
      })
      // TODO: check followers list to confirm that the undo removed the actor from the list
    })
  })
})
