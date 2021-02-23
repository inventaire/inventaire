const CONFIG = require('config')
const fetch = require('node-fetch')
require('should')
const { wait } = require('lib/promises')
const { createUser, createUsername } = require('../fixtures/users')
const host = CONFIG.fullHost()

const buildActorUrl = name => {
  return `${host}/api/activitypub?action=actor&name=${name}`
}

describe('activitypub:actor', () => {
  it('should reject unknown actor', async () => {
    const username = createUsername()
    const res = await fetch(buildActorUrl(username), {
      method: 'GET',
      headers: {
        'content-type': 'application/activity+json'
      }
    })
    res.status.should.equal(404)
    const body = await res.json()
    body.status_verbose.should.equal('unknown actor')
  })

  it('should return a json ld file', async () => {
    const username = createUsername()
    const actorUrl = buildActorUrl(username)
    await createUser({ username })
    await wait(10)
    const body = await makeRequest(username)
    body['@context'].should.an.Array()
    body.type.should.equal('Person')
    body.id.should.equal(actorUrl)
    body.publicKey.should.be.an.Object()
    body.publicKey.owner.should.equal(actorUrl)
  })
})

const makeRequest = async username => {
  const res = await fetch(buildActorUrl(username), {
    method: 'GET',
    headers: {
      'content-type': 'application/activity+json'
    }
  })
  return res.json()
}
