import { makeUrl } from '#controllers/activitypub/lib/helpers'
import { signRequest, verifySignature } from '#controllers/activitypub/lib/security'
import { getSharedKeyPair } from '#controllers/activitypub/lib/shared_key_pair'
import { getRandomBytes } from '#lib/crypto'
import { jsonBodyParser } from '#server/middlewares/content'
import { startGenericMockServer } from '#tests/integration/utils/mock_server'
import { createUsername } from '../fixtures/users.js'
import { rawRequest } from '../utils/request.js'

// In a separate file since createUser has a circular dependency in api/utils/request.js
export async function signedReq ({ method, object, url, body, emitterUser, type }) {
  const { id, username, keyId, privateKey, origin } = await getSomeRemoteServerUser(emitterUser)
  if (!body) {
    body = createActivity({
      actor: keyId,
      object,
      origin,
      type,
    })
  }
  method = body ? 'post' : 'get'
  const headers = signRequest({ url, method, keyId, privateKey, body })
  const params = { headers }
  if (method === 'post') params.body = body
  const res = await rawRequest(method, url, params)
  return Object.assign(res, {
    remoteHost: origin,
    remoteUserId: id,
    remoteUsername: username,
  })
}

export const createActivity = (params = {}) => {
  const { object, actor, origin, type = 'Follow' } = params
  let { externalId } = params
  externalId = externalId || `${origin}/${getRandomBytes(20, 'hex')}`
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: externalId,
    type,
    actor,
    object,
  }
}

export const createRemoteActivityPubServerUser = async () => {
  const { publicKey, privateKey } = await getSharedKeyPair()
  const { host, origin } = await getActivityPubServer()
  const username = createUsername()
  const actorUrl = `http://${host}${actorEndpoint}?name=${username}`
  const user = {
    id: actorUrl,
    actor: actorUrl,
    username,
    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: publicKey,
    },
    privateKey,
    inbox: `${origin}${inboxEndpoint}?username=${username}`,
  }
  remoteActivityPubServerUsers[user.username] = user
  return user
}

const actorEndpoint = '/some_actor_endpoint'

export async function getSomeRemoteServerUser (emitterUser) {
  const { origin } = await getActivityPubServer()
  emitterUser = emitterUser || (await createRemoteActivityPubServerUser())
  const { id, username, privateKey } = emitterUser
  const query = { name: username }
  const keyId = makeUrl({ origin, params: query, endpoint: actorEndpoint })
  return { id, username, keyId, privateKey, origin }
}

const remoteActivityPubServerUsers = {}

const inboxEndpoint = '/inbox'
const inboxInspectionEndpoint = '/inbox_inspection'

let removeActivityPubServer
const getActivityPubServer = async () => {
  removeActivityPubServer = removeActivityPubServer || (await startActivityPubServer())
  return removeActivityPubServer
}

const startActivityPubServer = async () => {
  const { port, host, origin } = await startGenericMockServer(app => {
    app.use(jsonBodyParser)
    app.get(actorEndpoint, async (req, res) => {
      const { name } = req.query
      const user = remoteActivityPubServerUsers[name]
      if (user) {
        res.json(user)
      } else {
        res.status(404).json({ found: false })
      }
    })

    const inboxes = {}

    app.post(inboxEndpoint, async (req, res) => {
      await verifySignature(req)
      let { username } = req.query
      // since shelf uri is contains ':'
      username = decodeURIComponent(username)
      const activity = req.body
      inboxes[username] = inboxes[username] || []
      inboxes[username].unshift(activity)
      res.json({ ok: true })
    })

    app.get(inboxInspectionEndpoint, async (req, res) => {
      const { username } = req.query
      res.json({ inbox: inboxes[username] })
    })
  })

  return { port, host, origin }
}
