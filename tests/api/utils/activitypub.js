const { rawRequest } = require('../utils/request')
const { signRequest } = require('controllers/activitypub/lib/security')
const { getSharedKeyPair } = require('controllers/activitypub/lib/shared_key_pair')
const { getRandomBytes } = require('lib/crypto')
const express = require('express')
const { createUsername } = require('../fixtures/users')
const makeUrl = require('controllers/activitypub/lib/make_url')
const requestsLogger = require('server/middlewares/requests_logger')
const { jsonBodyParser } = require('server/middlewares/content')

// in a separate file since createUser has a circular dependency in api/utils/request.js
const signedReq = async ({ method, object, url, body, emitterUser, type }) => {
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

const createActivity = (params = {}) => {
  const { object, actor, type = 'Follow', origin } = params
  let { externalId } = params
  externalId = externalId || `${origin}/${getRandomBytes(20, 'hex')}`
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: externalId,
    type,
    actor,
    object
  }
}

const createRemoteActivityPubServerUser = async () => {
  const { publicKey, privateKey } = await getSharedKeyPair()
  const username = createUsername()
  const actorUrl = `http://${host}${actorEndpoint}?name=${username}`
  const user = {
    id: actorUrl,
    actor: actorUrl,
    username,
    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: publicKey
    },
    privateKey,
    inbox: `${origin}${inboxEndpoint}?username=${username}`,
  }
  remoteActivityPubServerUsers[user.username] = user
  return user
}

const actorEndpoint = '/some_actor_endpoint'

let removeActivityPubServer
const getSomeRemoteServerUser = async emitterUser => {
  emitterUser = emitterUser || await createRemoteActivityPubServerUser()
  removeActivityPubServer = removeActivityPubServer || await startActivityPubServer()
  const { origin } = removeActivityPubServer
  const { id, username, privateKey } = emitterUser
  const query = { name: username }
  const keyId = makeUrl({ origin, params: query, endpoint: actorEndpoint })
  return { id, username, keyId, privateKey, origin }
}

const remoteActivityPubServerUsers = {}

const port = 1024 + Math.trunc(Math.random() * 10000)
const host = `localhost:${port}`
const origin = `http://${host}`
const inboxEndpoint = '/inbox'
const inboxInspectionEndpoint = '/inbox_inspection'

const startActivityPubServer = () => new Promise(resolve => {
  const app = express()
  app.use(requestsLogger)
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

  app.listen(port, () => resolve({ port, host, origin }))
})

module.exports = {
  getSomeRemoteServerUser,
  makeUrl,
  createActivity,
  createRemoteActivityPubServerUser,
  signedReq
}
