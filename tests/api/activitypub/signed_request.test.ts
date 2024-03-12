import 'should'
import { makeUrl } from '#controllers/activitypub/lib/helpers'
import { sign } from '#controllers/activitypub/lib/security'
import { generateRsaKeyPair } from '#lib/crypto'
import config from '#server/config'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createUsername, createUser } from '../fixtures/users.js'
import {
  signedReq,
  createActivity,
  getSomeRemoteServerUser,
  createRemoteActivityPubServerUser,
} from '../utils/activitypub.js'
import { rawRequest } from '../utils/request.js'

const endpoint = '/api/activitypub'

const inboxReq = async ({ emitterUser, username }) => {
  if (!username) username = createUsername()
  const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
  const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
  return signedReq({
    emitterUser,
    object: actorUrl,
    url: inboxUrl,
  })
}

describe('activitypub:signed:request', () => {
  it('should reject unsigned request', async () => {
    try {
      const username = createUsername()
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const body = createActivity({ actor: 'foo', object: 'bar' })
      await rawRequest('post', inboxUrl, {
        headers: {
          'content-type': 'application/activity+json',
        },
        body,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('no signature header')
    }
  })

  it('should reject when no publicKey is found', async () => {
    try {
      const emitterUser = await createRemoteActivityPubServerUser()
      delete emitterUser.publicKey
      await inboxReq({ emitterUser })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('no publicKey found')
    }
  })

  it('should reject when fetching an invalid publicKey', async () => {
    try {
      const emitterUser = await createRemoteActivityPubServerUser()
      emitterUser.publicKey = 'foo'
      await inboxReq({ emitterUser })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('invalid publicKey found')
    }
  })

  it('should reject when key verification fails', async () => {
    try {
      const emitterUser = await createRemoteActivityPubServerUser()
      const { privateKey } = await generateRsaKeyPair()
      emitterUser.privateKey = privateKey
      await inboxReq({ emitterUser })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('signature verification failed')
    }
  })

  it('should reject if date header is more than 30 seconds old', async () => {
    try {
      const emitterUser = await createRemoteActivityPubServerUser()
      const { username, keyId } = await getSomeRemoteServerUser(emitterUser)
      const now = new Date()
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toUTCString()
      const { publicHostname } = config
      const reqHeaders = {
        host: publicHostname,
        date: thirtySecondsAgo,
      }
      const signedHeadersNames = Object.keys(reqHeaders).join(' ')
      const method = 'post'
      reqHeaders.signature = sign({
        method,
        keyId,
        privateKey: emitterUser.privateKey,
        endpoint,
        signedHeadersNames,
        reqHeaders,
      })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const body = createActivity({ actor: 'foo', object: 'bar' })
      await rawRequest(method, inboxUrl, {
        headers: reqHeaders,
        body,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      const parsedBody = JSON.parse(err.body)
      parsedBody.status.should.equal(400)
      parsedBody.status_verbose.should.equal('outdated request')
    }
  })

  it('should verify request', async () => {
    const { username } = await createUser({ fediversable: true })
    const res = await inboxReq({ username })
    const resBody = JSON.parse(res.body)
    resBody.ok.should.be.true()
  })
})
