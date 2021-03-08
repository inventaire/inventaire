const express = require('express')

const startActivityPubServer = emetterUser => new Promise(resolve => {
  const port = 1024 + Math.trunc(Math.random() * 10000)
  const { publicKey, username } = emetterUser
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
    return res.json({ publicKey })
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

module.exports = { startActivityPubServer }
