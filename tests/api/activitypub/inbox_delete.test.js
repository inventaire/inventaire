require('should')
const { createUser } = require('../fixtures/users')
const { makeUrl, createRemoteActivityPubServerUser, signedReq } = require('../utils/activitypub')
const { rawRequest } = require('../utils/request')

describe('activitypub:inbox:Delete', () => {
  it('should ignore signed delete requests', async () => {
    const { username } = await createUser({ fediversable: true })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const emitterUser = await createRemoteActivityPubServerUser()
    const res = await signedReq({
      emitterUser,
      url: inboxUrl,
      type: 'Delete',
      object: 'foo',
    })
    res.statusCode.should.equal(200)
  })

  it('should ignore non-signed delete requests', async () => {
    const { username } = await createUser({ fediversable: true })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const res = await rawRequest('post', inboxUrl, {
      body: {
        id: 'foo',
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Delete',
        actor: 'buzz',
        object: 'bar',
      }
    })
    res.statusCode.should.equal(200)
  })
})
