import { makeUrl } from '#controllers/activitypub/lib/helpers'
import { signRequest, verifySignature } from '#controllers/activitypub/lib/security'
import { getSharedKeyPair } from '#controllers/activitypub/lib/shared_key_pair'
import { createUsername } from '#fixtures/users'
import { getRandomBytes } from '#lib/crypto'
import { jsonBodyParser } from '#server/middlewares/content'
import { startGenericMockServer, type Server } from '#tests/integration/utils/mock_server'
import type { LocalActorUrl, ActivityId, ActivityType, Context, ObjectType } from '#types/activity'
import type { Url, HttpMethod, Host, Origin, AbsoluteUrl } from '#types/common'
import type { UserId, Username } from '#types/user'
import { rawRequest } from './request.js'

interface ActivityBody {
  '@context'?: Context[]
  id?: ActivityId
  type?: ActivityType
  actor?: LocalActorUrl
  object?: any
  origin?: Url
}

export interface TestsActorActivity {
  id: LocalActorUrl
  name: string
  preferredUsername: string
  inbox: Url
  sharedInbox?: Url
  publicKey: {
    id: string
    owner: LocalActorUrl
    publicKeyPem?: {
      publicKeyHash: string
    }
  }
  privateKey: string
  icon?: {
    mediaType: 'image/jpeg'
    type: 'Image'
    url: string
  }
}

interface SignedReqParams {
  method?: HttpMethod
  object?: any
  url?: AbsoluteUrl
  body?: ActivityBody
  emitterUser?: TestsActorActivity
  type?: ActivityType
  withSharedInbox?: boolean
}

// In a separate file since createUser has a circular dependency in api/utils/request.js
export async function signedReq ({ method, object, url, body, emitterUser, type, withSharedInbox }: SignedReqParams) {
  const { id, username, keyId, privateKey, origin } = await getSomeRemoteServerUser(emitterUser, withSharedInbox)
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
  // @ts-expect-error
  if (method === 'post') params.body = body
  const res = await rawRequest(method, url, params)
  const resParams: {
    remoteHost: Origin
    remoteUserId: UserId
    remoteUsername: Username
    statusCode: number
  } = {
    remoteHost: origin,
    remoteUserId: id,
    remoteUsername: username,
    statusCode: res.statusCode,
  }
  return resParams
}

interface CreateActivityParams {
  '@context'?: Context[]
  id?: ActivityId
  type?: ActivityType
  actor?: LocalActorUrl
  object?: ObjectType
  origin?: Url
  externalId?: Url
}

export const createActivity = (params: CreateActivityParams = {}) => {
  const { object, actor, origin, type = 'Follow' } = params
  let { externalId } = params
  externalId ??= `${origin}/${getRandomBytes(20, 'hex')}`
  const context: Context[] = [ 'https://www.w3.org/ns/activitystreams' ]
  return {
    '@context': context,
    id: externalId,
    type,
    actor,
    object,
  }
}

export const createRemoteActivityPubServerUser = async (withSharedInbox?: boolean) => {
  const { publicKey, privateKey } = await getSharedKeyPair()
  const { host, origin } = await getActivityPubServer()
  const username = createUsername()
  const actorUrl: LocalActorUrl = `http://${host}${actorEndpoint}?name=${username}`
  const inbox = `${origin}${inboxEndpoint}?username=${username}` as Url
  const sharedInbox = `${origin}${sharedInboxEndpoint}` as Url
  const user: TestsActorActivity = {
    id: actorUrl,
    name: username,
    preferredUsername: username,
    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: publicKey,
    },
    privateKey,
    inbox,
    icon: {
      mediaType: 'image/jpeg',
      type: 'Image',
      url: 'https://inventaire.io/img/users/646b5a207488f9f745594e8934e9dd5528f6a44f',
    },
  }
  if (withSharedInbox) {
    Object.assign(user, { sharedInbox })
  }
  remoteActivityPubServerUsers[username] = user
  return user
}

const actorEndpoint = '/some_actor_endpoint'

export async function getSomeRemoteServerUser (emitterUser, withSharedInbox: boolean = true) {
  const { origin } = await getActivityPubServer()
  emitterUser ??= await createRemoteActivityPubServerUser(withSharedInbox)
  const { id, name, privateKey } = emitterUser
  const query = { name }
  const keyId = makeUrl({ origin, params: query, endpoint: actorEndpoint })
  return { id, username: name, keyId, privateKey, origin }
}

const remoteActivityPubServerUsers = {}

const inboxEndpoint = '/inbox'
const inboxInspectionEndpoint = '/inbox_inspection'
const sharedInboxEndpoint = '/shared_inbox'
const sharedInboxInspectionEndpoint = '/shared_inbox_inspection'

let removeActivityPubServer
const getActivityPubServer = async () => {
  removeActivityPubServer ??= await startActivityPubServer()
  return removeActivityPubServer
}

const startActivityPubServer = async () => {
  const { port, host, origin }: { port: number, host: Host, origin: Url, server: Server } = await startGenericMockServer(app => {
    app.use(jsonBodyParser)
    app.get(actorEndpoint, async (req, res) => {
      const name = req.query.name as string
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
      let username = req.query.username as string
      // since shelf uri is contains ':'
      username = decodeURIComponent(username)
      const activity = req.body
      inboxes[username] = inboxes[username] || []
      inboxes[username].unshift(activity)
      res.json({ ok: true })
    })

    app.get(inboxInspectionEndpoint, async (req, res) => {
      const username = req.query.username as string
      res.json({ inbox: inboxes[username] })
    })

    let sharedInbox = []

    app.post(sharedInboxEndpoint, async (req, res) => {
      await verifySignature(req)
      const activity = req.body
      sharedInbox ??= []
      sharedInbox.unshift(activity)
      res.json({ ok: true })
    })

    app.get(sharedInboxInspectionEndpoint, async (req, res) => {
      res.json({ inbox: sharedInbox })
    })
  })

  return { port, host, origin }
}
