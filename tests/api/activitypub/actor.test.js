require('should')
const { createUser, createUsername } = require('../fixtures/users')
const { makeUrl } = require('../utils/activitypub')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, publicReq } = require('../utils/utils')

describe('activitypub:actor', () => {
  it('should reject unknown actor', async () => {
    try {
      const name = createUsername()
      const receiverUrl = makeUrl({ params: { action: 'actor', name } })
      await publicReq('get', receiverUrl)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('not found')
      err.body.status.should.equal(404)
    }
  })

  it('should reject if receiver user is not on the fediverse', async () => {
    try {
      const { username } = await createUser({ fediversable: false })
      const receiverUrl = makeUrl({ params: { action: 'actor', name: username } })
      await publicReq('get', receiverUrl)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('user is not on the fediverse')
      err.body.status.should.equal(404)
    }
  })

  it('should return a json ld file with a receiver actor url', async () => {
    const { username } = await createUser({ fediversable: true })
    const receiverUrl = makeUrl({ params: { action: 'actor', name: username } })
    const receiverInboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const receiverOutboxUrl = makeUrl({ params: { action: 'outbox', name: username } })
    const body = await publicReq('get', receiverUrl)
    body['@context'].should.an.Array()
    body.type.should.equal('Person')
    body.id.should.equal(receiverUrl)
    body.publicKey.should.be.an.Object()
    body.inbox.should.equal(receiverInboxUrl)
    body.outbox.should.equal(receiverOutboxUrl)
    body.publicKey.owner.should.equal(receiverUrl)
  })
})
