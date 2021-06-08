require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { query, startServerWithEmetterUser, createReceiver, makeUrl } = require('../utils/activity_pub')
const { rawRequest } = require('../utils/request')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

const endpoint = '/api/activitypub'

describe('activitypub:actor', () => {
  it('should reject unsigned request', async () => {
    try {
      const receiverUsername = createUsername()
      await rawRequest('get', query({ action: 'actor', username: receiverUsername }), {
        headers: {
          'content-type': 'application/activity+json'
        }
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('no signature header')
    }
  })

  it('should reject when no publicKey is found', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      delete emetterUser.publicKey
      const emetterActorUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverActorUrl = makeUrl({ action: 'actor', username })
      await signedReq('get', endpoint, receiverActorUrl, emetterActorUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('no publicKeyPem found')
    }
  })

  it('should reject when fetching an invalid publicKey', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      emetterUser.publicKey = 'foo'
      const emetterActorUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverActorUrl = makeUrl({ action: 'actor', username })
      await signedReq('get', endpoint, receiverActorUrl, emetterActorUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('invalid publicKeyPem found')
    }
  })

  it('should reject when key verification fails', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      const anotherUser = await createUserOnFediverse()
      emetterUser.privateKey = anotherUser.privateKey
      const emetterActorUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverActorUrl = makeUrl({ action: 'actor', username })
      await signedReq('get', endpoint, receiverActorUrl, emetterActorUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status.should.equal(500)
      parsedBody.status_verbose.should.equal('signature verification failed')
    }
  })

  it('should reject unknown actor', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      const emetterActorUrl = await startServerWithEmetterUser(emetterUser)
      const imaginaryReceiverUsername = createUsername()
      const receiverActorUrl = makeUrl({ action: 'actor', username: imaginaryReceiverUsername })
      await signedReq('get', endpoint, receiverActorUrl, emetterActorUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('unknown actor')
      parsedBody.status.should.equal(404)
    }
  })

  it('should reject user who is not on the fediverse', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      const emetterActorUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverActorUrl = makeUrl({ action: 'actor', username })
      await signedReq('get', endpoint, receiverActorUrl, emetterActorUrl, emetterUser.privateKey)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('this user is not on the fediverse')
      parsedBody.status.should.equal(404)
    }
  })

  it('should return a json ld file with a receiver actor url', async () => {
    const emetterUser = await createUserOnFediverse()
    const emetterActorUrl = await startServerWithEmetterUser(emetterUser)
    const { username } = await createReceiver()
    const receiverActorUrl = makeUrl({ action: 'actor', username })
    const receiverInboxUrl = makeUrl({ action: 'inbox', username })
    const res = await signedReq('get', endpoint, receiverActorUrl, emetterActorUrl, emetterUser.privateKey)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
    body.type.should.equal('Person')
    body.preferredUsername.should.equal(username)
    body.id.should.equal(receiverActorUrl)
    body.publicKey.should.be.an.Object()
    body.inbox.should.equal(receiverInboxUrl)
    body.publicKey.owner.should.equal(receiverActorUrl)
  })
})
