require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { startServerWithEmitterAndReceiver, startServerWithEmitterUser, createReceiver, makeUrl, actorSignReq } = require('../utils/activity_pub')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

describe('activitypub:actor', () => {
  it('should reject unknown actor', async () => {
    try {
      const emitterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmitterUser({ emitterUser })
      const emitterUrl = origin.concat(query)
      const imaginaryReceiverUsername = createUsername()
      const receiverUrl = makeUrl({ action: 'actor', username: imaginaryReceiverUsername })
      await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
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
      const emitterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmitterUser({ emitterUser })
      const emitterUrl = origin.concat(query)
      const { username } = await createReceiver({ fediversable: false })
      const receiverUrl = makeUrl({ action: 'actor', username })
      await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
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
    const emitterUser = await createUserOnFediverse()
    const { receiverUrl, emitterUrl, receiverUsername } = await startServerWithEmitterAndReceiver({ emitterUser })
    const receiverInboxUrl = makeUrl({ action: 'inbox', username: receiverUsername })
    const res = await actorSignReq(receiverUrl, emitterUrl, emitterUser.privateKey)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
    body.type.should.equal('Person')
    body.id.should.equal(receiverUrl)
    body.publicKey.should.be.an.Object()
    body.inbox.should.equal(receiverInboxUrl)
    body.publicKey.owner.should.equal(receiverUrl)
  })
})
