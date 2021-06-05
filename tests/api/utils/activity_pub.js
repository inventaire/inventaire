const _ = require('builders/utils')
const express = require('express')
const { createUser, createUsername } = require('../fixtures/users')
const CONFIG = require('config')
const host = CONFIG.fullHost()
const endpoint = '/api/activitypub'

const query = username => `${endpoint}?action=actor&name=${username}`

const createReceiver = async (customData = {}) => {
  const username = createUsername()
  const userAttributes = _.extend({
    username,
    fediversable: true
  }, customData)
  await createUser(userAttributes)
  return makeReceiverActorUrl(username)
}

const makeActorUrl = receiverUsername => `${host}${query(receiverUsername)}`

const startServerWithEmetterUser = async emetterUser => {
  const { origin } = await startActivityPubServer(emetterUser)
  return `${origin}${query(emetterUser.username)}`
}

const startActivityPubServer = emetterUser => new Promise(resolve => {
  const port = 1024 + Math.trunc(Math.random() * 10000)
  const { publicKey: publicKeyPem, username } = emetterUser
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`
  const webfingerEndpoint = '/.well-known/webfinger?resource='
  const resource = `acct:${username}@${host}`
  const actorEndpoint = '/api/activitypub/'

  app.get(`${webfingerEndpoint}${resource}`, async (req, res) => {
    return res.json(formatWebfinger(origin, actorEndpoint, resource))
  })

  app.get(actorEndpoint, async (req, res) => {
    return res.json({ publicKey: { publicKeyPem } })
  })

  app.listen(port, () => resolve({ port, host, origin }))
})

const formatWebfinger = (origin, actorEndpoint, resource) => {
  const actorUrl = `${origin}${actorEndpoint}`
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

module.exports = { startActivityPubServer, query, createReceiver, makeActorUrl, startServerWithEmetterUser }
