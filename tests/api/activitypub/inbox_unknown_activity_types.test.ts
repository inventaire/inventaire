import 'should'
import { makeUrl } from '#controllers/activitypub/lib/helpers'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { createUser } from '../fixtures/users.js'
import { createRemoteActivityPubServerUser, signedReq } from '../utils/activitypub.js'
import { rawRequest } from '../utils/request.js'

describe('activitypub:inbox:unknown_types', () => {
  it('should reject signed unknown activity type requests', async () => {
    const { username } = await createUser({ fediversable: true })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    const emitterUser = await createRemoteActivityPubServerUser()
    await signedReq({
      emitterUser,
      url: inboxUrl,
      type: 'Delete',
      object: 'foo',
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
    })
  })

  it('should reject non-signed unknown activity type requests', async () => {
    const { username } = await createUser({ fediversable: true })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    await rawRequest('post', inboxUrl, {
      body: {
        id: 'foo',
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Delete',
        actor: 'buzz',
        object: 'bar',
      },
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
    })
  })
})
