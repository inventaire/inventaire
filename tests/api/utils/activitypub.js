const { rawRequest } = require('../utils/request')
const { signRequest } = require('controllers/activitypub/lib/security')
const { getRandomBytes, keyPair } = require('lib/crypto')
const { generateKeyPair } = keyPair
const express = require('express')
const { createUsername } = require('../fixtures/users')
const makeUrl = require('controllers/activitypub/lib/make_url')
const requestsLogger = require('server/middlewares/requests_logger')
const { jsonBodyParser } = require('server/middlewares/content')

// in a separate file since createUser has a circular dependency in api/utils/request.js
const signedReq = async ({ method, object, url, body, emitterUser, type }) => {
  const { keyUrl, privateKey, origin } = await getSomeRemoteServerUser(emitterUser)
  if (!body) {
    body = createActivity({
      actor: keyUrl,
      object,
      origin,
      type,
    })
  }
  method = body ? 'post' : 'get'
  const headers = signRequest({ method, keyUrl, privateKey })
  const params = { headers }
  if (method === 'post') params.body = body
  const res = await rawRequest(method, url, params)
  return Object.assign(res, { remoteHost: origin })
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
  const user = await generateKeyPair()
  user.username = createUsername()
  remoteActivityPubServerUsers[user.username] = user
  return user
}

const remoteServerActivityPubEndpoint = '/some_ap_endpoint'

let removeActivityPubServer
const getSomeRemoteServerUser = async emitterUser => {
  emitterUser = emitterUser || await createRemoteActivityPubServerUser()
  removeActivityPubServer = removeActivityPubServer || await startActivityPubServer()
  const { origin } = removeActivityPubServer
  const { username, privateKey } = emitterUser
  const query = { name: username }
  const keyUrl = makeUrl({ origin, params: query, endpoint: remoteServerActivityPubEndpoint })
  return { username, keyUrl, privateKey, origin }
}

const remoteActivityPubServerUsers = {}

const startActivityPubServer = () => new Promise(resolve => {
  const port = 1024 + Math.trunc(Math.random() * 10000)
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`
  const inboxEndpoint = '/inbox'
  const inboxInspectionEndpoint = '/inbox_inspection'

  app.use(requestsLogger)
  app.use(jsonBodyParser)

  app.get(remoteServerActivityPubEndpoint, async (req, res) => {
    const { name } = req.query
    const user = remoteActivityPubServerUsers[name]
    if (user) {
      res.json({
        publicKey: { publicKeyPem: user.publicKey },
        inbox: origin + inboxEndpoint,
      })
    } else {
      res.status(400).json({ found: false })
    }
  })

  const inboxes = {}

  app.post(inboxEndpoint, async (req, res) => {
    const activity = req.body
    const { actor } = activity
    const username = new URL(actor).searchParams.get('name')
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
