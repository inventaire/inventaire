require('should')
const { createUser, createUsername } = require('../fixtures/users')
const { createHuman, createEdition } = require('../fixtures/entities')
const { makeUrl } = require('../utils/activitypub')
const { updateUser } = require('../utils/users')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, publicReq } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')

describe('activitypub:actor', () => {
  it('should reject unknown actor', async () => {
    try {
      const name = createUsername()
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      await publicReq('get', actorUrl)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('not found')
      err.body.status.should.equal(404)
    }
  })

  describe('users', () => {
    it('should reject if receiver user is not on the fediverse', async () => {
      try {
        const { username } = await createUser({ fediversable: false })
        const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
        await publicReq('get', actorUrl)
        .then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.body.status_verbose.should.equal('user is not on the fediverse')
        err.body.status.should.equal(404)
      }
    })

    it('should return a json ld file with a receiver actor url', async () => {
      const { username } = await createUser({ fediversable: true })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const outboxUrl = makeUrl({ params: { action: 'outbox', name: username } })
      const res = await publicReq('get', actorUrl)
      res.type.should.equal('Person')
      res.id.should.equal(actorUrl)
      res.preferredUsername.should.equal(username)
      res.publicKey.should.be.an.Object()
      res.inbox.should.equal(inboxUrl)
      res.outbox.should.equal(outboxUrl)
      res.publicKey.id.should.equal(`${actorUrl}#main-key`)
      res.publicKey.owner.should.equal(actorUrl)
    })

    it('should use the stable username', async () => {
      const initialUsername = createUsername()
      const newUsername = createUsername()
      const user = await createUser({ fediversable: true, username: initialUsername })
      await updateUser({ user, attribute: 'username', value: newUsername })
      const canonicalActorUrl = makeUrl({ params: { action: 'actor', name: initialUsername } })
      const canonicalInboxUrl = makeUrl({ params: { action: 'inbox', name: initialUsername } })
      const canonicalOutboxUrl = makeUrl({ params: { action: 'outbox', name: initialUsername } })
      const aliasActorUrl = makeUrl({ params: { action: 'actor', name: newUsername } })
      const res2 = await publicReq('get', aliasActorUrl)
      res2.id.should.equal(canonicalActorUrl)
      res2.preferredUsername.should.equal(initialUsername)
      res2.inbox.should.equal(canonicalInboxUrl)
      res2.outbox.should.equal(canonicalOutboxUrl)
      res2.publicKey.id.should.equal(`${canonicalActorUrl}#main-key`)
      res2.publicKey.owner.should.equal(canonicalActorUrl)
    })
  })

  describe('entities', () => {
    it('should return an entity actor', async () => {
      const { uri } = await createHuman()
      const receiverUrl = makeUrl({ params: { action: 'actor', name: uri } })
      const receiverInboxUrl = makeUrl({ params: { action: 'inbox', name: uri } })
      const receiverOutboxUrl = makeUrl({ params: { action: 'outbox', name: uri } })
      const body = await publicReq('get', receiverUrl)
      body['@context'].should.an.Array()
      body.type.should.equal('Person')
      body.id.should.equal(decodeURIComponent(receiverUrl))
      body.publicKey.should.be.an.Object()
      body.inbox.should.equal(decodeURIComponent(receiverInboxUrl))
      body.outbox.should.equal(decodeURIComponent(receiverOutboxUrl))
      body.publicKey.owner.should.equal(decodeURIComponent(receiverUrl))
    })

    it('should set an image when one is available', async () => {
      const { uri, image } = await createEdition()
      const receiverUrl = makeUrl({ params: { action: 'actor', name: uri } })
      const body = await publicReq('get', receiverUrl)
      body.icon.url.should.endWith(image.url)
    })
  })

  describe('shelves', () => {
    it('should reject if receiver user is not on the fediverse', async () => {
      try {
        const user = createUser({ fediversable: false })
        const { shelf } = await createShelf(user)
        const name = `shelf:${shelf._id}`
        const actorUrl = makeUrl({ params: { action: 'actor', name } })
        await publicReq('get', actorUrl)
        .then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.body.status_verbose.should.equal("shelf's owner is not on the fediverse")
        err.body.status.should.equal(404)
      }
    })

    it('should return a json ld file with a receiver actor url', async () => {
      const user = createUser({ fediversable: true })
      const { shelf } = await createShelf(user)
      const name = `shelf:${shelf._id}`
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
      const outboxUrl = makeUrl({ params: { action: 'outbox', name } })
      const res = await publicReq('get', actorUrl)
      res.type.should.equal('Person')
      res.id.should.equal(decodeURIComponent(actorUrl))
      res.preferredUsername.should.equal(name)
      res.publicKey.should.be.an.Object()
      res.inbox.should.equal(decodeURIComponent(inboxUrl))
      res.outbox.should.equal(decodeURIComponent(outboxUrl))
      res.publicKey.id.should.equal(decodeURIComponent(`${actorUrl}#main-key`))
      res.publicKey.owner.should.equal(decodeURIComponent(actorUrl))
    })
  })
})
