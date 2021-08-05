const CONFIG = require('config')
const _ = require('builders/utils')
const { rawRequest } = require('../utils/request')
const { sign } = require('controllers/activitypub/lib/security')
const { getRandomBytes, keyPair } = require('lib/crypto')
const { generateKeyPair } = keyPair
const express = require('express')
const { createUsername } = require('../fixtures/users')
const makeUrl = require('controllers/activitypub/lib/make_url')

const endpoint = '/api/activitypub'

// in a separate file since createUser has a circular dependency in api/utils/request.js
const signedReq = async ({ method, object, url, body, emitterUser }) => {
  const { keyUrl, privateKey, origin } = await startServerWithEmitterUser(emitterUser)
  if (!body) {
    body = createActivity({
      actor: keyUrl,
      object,
      origin
    })
  }
  const endpoint = '/api/activitypub'
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
    endpoint
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

const createSkinnyEmitterUser = async () => {
  const emitterUser = await generateKeyPair()
  emitterUser.username = createUsername()
  return emitterUser
}

const startServerWithEmitterUser = async emitterUser => {
  if (!emitterUser) emitterUser = await createSkinnyEmitterUser()
  const { origin } = await startActivityPubServer(emitterUser)
  const query = { action: 'actor', name: emitterUser.username }
  const keyUrl = makeUrl({ origin, params: query })
  const privateKey = emitterUser.privateKey
  return { keyUrl, privateKey, origin }
}

const startActivityPubServer = emitterUser => new Promise(resolve => {
  const port = 1024 + Math.trunc(Math.random() * 10000)
  const { publicKey: publicKeyPem, username } = emitterUser
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`
  const webfingerEndpoint = '/.well-known/webfinger?resource='
  const resource = `acct:${username}@${host}`

  app.get(`${webfingerEndpoint}${resource}`, async (req, res) => {
    return res.json(formatWebfinger(origin, endpoint, resource))
  })

  app.get(endpoint, async (req, res) => {
    return res.json({ publicKey: { publicKeyPem } })
  })

  app.listen(port, () => resolve({ port, host, origin }))
})

const formatWebfinger = (origin, resource) => {
  const actorUrl = `${origin}${endpoint}`
  return {
    subject: resource,
    aliases: [ actorUrl ],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl
      }
    ]
  }
}

module.exports = {
  startServerWithEmitterUser,
  makeUrl,
  createActivity,
  createSkinnyEmitterUser,
  signedReq
}
