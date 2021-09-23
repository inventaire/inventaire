require('should')
const { wait } = require('lib/promises')
const { createUser, createUsername } = require('../fixtures/users')
const { makeUrl } = require('../utils/activitypub')
const { updateUser } = require('../utils/users')
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
      err.body.status_verbose.should.equal('not found')
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

  it('should use the stable username', async () => {
    const initialUsername = createUsername()
    const newUsername = createUsername()
    const user = await createUser({ fediversable: true, username: initialUsername })
    await updateUser({ user, attribute: 'username', value: newUsername })
    await wait(500)
    const canonicalActorUrl = makeUrl({ params: { action: 'actor', name: initialUsername } })
    const canonicalInboxUrl = makeUrl({ params: { action: 'inbox', name: initialUsername } })
    const canonicalOutboxUrl = makeUrl({ params: { action: 'outbox', name: initialUsername } })
    const aliasActorUrl = makeUrl({ params: { action: 'actor', name: newUsername } })
    const res1 = await publicReq('get', canonicalActorUrl)
    res1.id.should.equal(canonicalActorUrl)
    res1.preferredUsername.should.equal(initialUsername)
    res1.inbox.should.equal(canonicalInboxUrl)
    res1.outbox.should.equal(canonicalOutboxUrl)
    res1.publicKey.id.should.equal(`${canonicalActorUrl}#main-key`)
    res1.publicKey.owner.should.equal(canonicalActorUrl)
    const res2 = await publicReq('get', aliasActorUrl)
    res2.id.should.equal(canonicalActorUrl)
    res2.preferredUsername.should.equal(initialUsername)
    res2.inbox.should.equal(canonicalInboxUrl)
    res2.outbox.should.equal(canonicalOutboxUrl)
    res2.publicKey.id.should.equal(`${canonicalActorUrl}#main-key`)
    res2.publicKey.owner.should.equal(canonicalActorUrl)
  })
})
