require('should')
const { createUser, createUsername } = require('../fixtures/users')
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
})
