require('should')
const { createUser, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { startServerWithEmetterUser, createReceiver, makeUrl, randomActivityId } = require('../utils/activity_pub')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

const endpoint = '/api/activitypub'

const inboxSignedReq = async params => {
  let { origin, emetterActorUrl, receiverInboxUrl, receiverActorUrl, emetterUser } = params
  if (!emetterActorUrl) {
    emetterUser = await createUserOnFediverse()
    const serverData = await startServerWithEmetterUser(emetterUser)
    if (!origin) { origin = serverData.origin }
    emetterActorUrl = origin.concat(serverData.query)
  }
  let { body } = params
  if (!body) {
    body = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: randomActivityId(origin),
      type: 'Follow',
      actor: emetterActorUrl,
      object: receiverActorUrl
    }
  }
  return signedReq({
    method: 'post',
    endpoint,
    url: receiverInboxUrl,
    keyUrl: emetterActorUrl,
    privateKey: emetterUser.privateKey,
    body
  })
}

describe('activitypub:post:inbox', () => {
  it('should reject without activity id', async () => {
    try {
      const { username } = await createReceiver()
      const receiverInboxUrl = makeUrl({ action: 'inbox', username })
      const body = {}
      await inboxSignedReq({ receiverInboxUrl, body })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('missing parameter in body: id')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject without activity type', async () => {
    try {
      const emetterUser = await createUserOnFediverse()
      const { origin, query } = await startServerWithEmetterUser(emetterUser)
      const emetterActorUrl = origin.concat(query)
      const { username } = await createReceiver()
      const body = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        // id is a unique to each activity minted by the emetter of a request
        // activity creation will be ignored if id is already found
        id: randomActivityId(origin),
      }
      const receiverInboxUrl = makeUrl({ action: 'inbox', username })
      await inboxSignedReq({ receiverInboxUrl, emetterActorUrl, emetterUser, body })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status_verbose.should.equal('missing parameter in body: type')
      parsedBody.status.should.equal(400)
    }
  })

  it('should reject if object name is not a fediversable user', async () => {
    try {
      const { username: nonFediversableUsername } = await createUser()
      const receiverActorUrl = makeUrl({ action: 'actor', username: nonFediversableUsername })
      const receiverInboxUrl = makeUrl({ action: 'inbox', username: nonFediversableUsername })
      await inboxSignedReq({ receiverInboxUrl, receiverActorUrl })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body
      )
      parsedBody.status_verbose.should.equal('not found')
      parsedBody.status.should.equal(404)
    }
  })

  it('should create an activity', async () => {
    const { username } = await createReceiver()
    const receiverActorUrl = makeUrl({ action: 'actor', username })
    const receiverInboxUrl = makeUrl({ action: 'inbox', username })
    const res = await inboxSignedReq({ receiverInboxUrl, receiverActorUrl })
    res.statusCode.should.equal(200)
  })
})
