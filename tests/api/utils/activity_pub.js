const _ = require('builders/utils')
const express = require('express')
const { createUser, createUsername, createUserOnFediverse } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const endpoint = '/api/activitypub'

const createReceiver = async (customData = {}) => {
  const username = createUsername()
  const userAttributes = _.extend({
    username,
    fediversable: true
  }, customData)
  return createUser(userAttributes)
}

const query = ({ action, username }) => `${endpoint}?action=${action}&name=${username}`
const makeUrl = params => `${host}${query(params)}`

const startServerWithEmetterAndReceiver = async ({ emetterUser }) => {
  const { origin, query } = await startServerWithEmetterUser({ emetterUser })
  const emetterUrl = origin.concat(query)
  const { username } = await createReceiver()
  const receiverUrl = makeUrl({ action: 'actor', username })
  return { receiverUrl, emetterUrl, receiverUsername: username }
}

const startServerWithEmetterUser = async ({ emetterUser, endpoints }) => {
  if (!emetterUser) emetterUser = await createUserOnFediverse()
  const { origin } = await startActivityPubServer({ user: emetterUser, endpoints })
  return {
    origin,
    query: query({ action: 'actor', username: emetterUser.username })
  }
}

const startActivityPubServer = ({ user, endpoints = [] }) => new Promise(resolve => {
  const port = 1024 + Math.trunc(Math.random() * 10000)
  const { publicKey: publicKeyPem, username } = user
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`
  const webfingerEndpoint = '/.well-known/webfinger?resource='
  const resource = `acct:${username}@${host}`

  for (const endpt of endpoints) {
    app.get('/' + endpt.name, (req, res) => {
      return res.json(endpt.resData)
    })
  }
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

const actorSignReq = async (receiverUrl, emetterUrl, privateKey) => {
  return signedReq({
    method: 'get',
    endpoint,
    url: receiverUrl,
    keyUrl: emetterUrl,
    privateKey
  })
}

module.exports = { startServerWithEmetterAndReceiver, query, createReceiver, makeUrl, startServerWithEmetterUser, actorSignReq }
