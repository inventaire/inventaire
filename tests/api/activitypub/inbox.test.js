require('should')
const { createUser, createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { makeUrl, createActivity } = require('../utils/activitypub')

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

  it('should create an activity', async () => {
    const { username } = await createUserOnFediverse()
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const res = await signedReq({
      object: actorUrl,
      url: inboxUrl
    })
    res.statusCode.should.equal(200)
    const parsedBody = JSON.parse(res.body)
    parsedBody['@context'].should.containEql('https://www.w3.org/ns/activitystreams')
    parsedBody.type.should.equal('Accept')
    parsedBody.object.name.should.equal(username)
  })
})
