require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { startServerWithEmitterAndReceiver, startServerWithEmitterUser, createReceiver, makeUrl } = require('../utils/activity_pub')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, signedReq } = require('../utils/utils')

describe('activitypub:actor', () => {
  it('should reject unknown actor', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmitterUser({ emitterUser })
      const keyUrl = origin.concat(query)
      const imaginaryReceiverUsername = createUsername()
      const receiverUrl = makeUrl({ action: 'actor', username: imaginaryReceiverUsername })
      await signedReq({ url: receiverUrl, keyUrl, privateKey: emitterUser.privateKey })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('not found')
      parsedBody.status.should.equal(404)
    }
  })

  it('should reject if receiver user is not on the fediverse', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmitterUser({ emitterUser })
      const keyUrl = origin.concat(query)
      const { username } = await createReceiver({ fediversable: false })
      const receiverUrl = makeUrl({ action: 'actor', username })
      await signedReq({ url: receiverUrl, keyUrl, privateKey: emitterUser.privateKey })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('user is not on the fediverse')
      parsedBody.status.should.equal(404)
    }
  })

  it('should return a json ld file with a receiver actor url', async () => {
    const emitterUser = await createUserOnFediverse()
    const { receiverUrl, keyUrl, receiverUsername } = await startServerWithEmitterAndReceiver({ emitterUser })
    const receiverInboxUrl = makeUrl({ action: 'inbox', username: receiverUsername })
    const res = await signedReq({ url: receiverUrl, keyUrl, privateKey: emitterUser.privateKey })
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
    body.type.should.equal('Person')
    body.id.should.equal(receiverUrl)
    body.publicKey.should.be.an.Object()
    body.inbox.should.equal(receiverInboxUrl)
    body.publicKey.owner.should.equal(receiverUrl)
  })
})
