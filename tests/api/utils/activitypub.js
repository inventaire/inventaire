const CONFIG = require('config')
const _ = require('builders/utils')
const { rawRequest } = require('../utils/request')
const { sign } = require('controllers/activitypub/lib/security')
const { getRandomBytes, keyPair } = require('lib/crypto')
const { generateKeyPair } = keyPair
const express = require('express')
const { createUsername } = require('../fixtures/users')
const makeUrl = require('controllers/activitypub/lib/make_url')

// in a separate file since createUser has a circular dependency in api/utils/request.js
const signedReq = async ({ method, object, url, body, emitterUser }) => {
  const { keyUrl, privateKey, origin } = await getSomeRemoteServerUser(emitterUser)
  if (!body) {
    body = createActivity({
      actor: keyUrl,
      object,
      origin
    })
  }
  method = body ? 'post' : 'get'
  const date = (new Date()).toUTCString()
  const publicHost = CONFIG.host
  // The minimum recommended data to sign is the (request-target), host, and date.
  // source https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-10#appendix-C.2
  const signatureHeaders = {
    host: publicHost,
    date
  }
  const signatureHeadersInfo = `(request-target) ${Object.keys(signatureHeaders).join(' ')}`
  const signature = sign(_.extend({
    headers: signatureHeadersInfo,
    method,
    keyUrl,
    privateKey,
    endpoint: '/api/activitypub'
  }, signatureHeaders))
  const headers = _.extend({ signature }, signatureHeaders)
  const params = { headers }
  if (method === 'post') _.extend(params, { body })
  return rawRequest(method, url, params)
}

const createActivity = (params = {}) => {
  const { object, actor, type, origin } = params
  let { externalId } = params
  if (!externalId) externalId = `${origin}/${getRandomBytes(20, 'hex')}`
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: externalId,
    type: type || 'Follow',
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
  return { keyUrl, privateKey, origin }
}

const remoteActivityPubServerUsers = {}

const startActivityPubServer = () => new Promise(resolve => {
  const port = 1024 + Math.trunc(Math.random() * 10000)
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`

  app.get(remoteServerActivityPubEndpoint, async (req, res) => {
    const { name } = req.query
    const user = remoteActivityPubServerUsers[name]
    if (user) {
      res.json({ publicKey: { publicKeyPem: user.publicKey } })
    } else {
      res.status(400).json({ found: false })
    }
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
