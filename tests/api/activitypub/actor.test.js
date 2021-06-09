require('should')
const { createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { startServerWithEmetterUser, createReceiver, makeUrl } = require('../utils/activity_pub')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

const endpoint = '/api/activitypub'
const actorSignReq = async (receiverUrl, emetterUrl, privateKey) => {
  return signedReq({
    method: 'get',
    endpoint,
    url: receiverUrl,
    keyUrl: emetterUrl,
    privateKey
  })
}

describe('activitypub:actor', () => {
  it('should reject unknown actor', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      const emetterUrl = await startServerWithEmetterUser(emetterUser)
      const imaginaryReceiverUsername = createUsername()
      const receiverUrl = makeUrl({ action: 'actor', username: imaginaryReceiverUsername })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
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
      const emetterUrl = await startServerWithEmetterUser(emetterUser)
      const { username } = await createReceiver({ fediversable: false })
      const receiverUrl = makeUrl({ action: 'actor', username })
      await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
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
    const emetterUrl = await startServerWithEmetterUser(emetterUser)
    const { username } = await createReceiver()
    const receiverUrl = makeUrl({ action: 'actor', username })
    const receiverInboxUrl = makeUrl({ action: 'inbox', username })
    const res = await actorSignReq(receiverUrl, emetterUrl, emetterUser.privateKey)
    const body = JSON.parse(res.body)
    body['@context'].should.an.Array()
    body.type.should.equal('Person')
    body.preferredUsername.should.equal(username)
    body.id.should.equal(receiverUrl)
    body.publicKey.should.be.an.Object()
    body.inbox.should.equal(receiverInboxUrl)
    body.publicKey.owner.should.equal(receiverUrl)
  })
})
