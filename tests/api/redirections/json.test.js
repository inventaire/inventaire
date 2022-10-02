const CONFIG = require('config')
const host = CONFIG.getPublicOrigin()
require('should')
const { rawRequest } = require('../utils/request')
const { createHuman } = require('../fixtures/entities')
const { createUser } = require('../fixtures/users')
const { getSomeGroup } = require('../fixtures/groups')
const { createItem } = require('../fixtures/items')
const someEntityPromise = createHuman()
const someUserPromise = createUser()
const someItemPromise = createItem()

describe('json redirections', () => {
  it('should redirect to an entity', async () => {
    const { _id } = await someEntityPromise
    const uri = `inv:${_id}`
    const { headers } = await rawRequest('get', `/entity/${uri}.json`)
    headers.location.should.equal(`${host}/api/entities?action=by-uris&uris=${uri}`)
  })

  it('should redirect to an item by id', async () => {
    const { _id } = await someItemPromise
    const { headers } = await rawRequest('get', `/items/${_id}.json`)
    headers.location.should.equal(`${host}/api/items?action=by-ids&ids=${_id}`)
  })

  describe('users', () => {
    it('should redirect to a user by id', async () => {
      const { _id } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${_id}.json`)
      headers.location.should.equal(`${host}/api/users?action=by-ids&ids=${_id}`)
    })

    it('should redirect to a user by username', async () => {
      const { username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}.json`)
      headers.location.should.equal(`${host}/api/users?action=by-usernames&usernames=${username}`)
    })

    // Legacy
    it('should redirect to a user by username from /inventory/:username', async () => {
      const { username } = await someUserPromise
      const { headers } = await rawRequest('get', `/inventory/${username}.json`)
      headers.location.should.equal(`${host}/api/users?action=by-usernames&usernames=${username}`)
    })
  })

  describe('groups', () => {
    it('should redirect to a group by id', async () => {
      const { _id } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${_id}.json`)
      headers.location.should.equal(`${host}/api/groups?action=by-id&id=${_id}`)
    })

    it('should redirect to a group by slug', async () => {
      const { slug } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${slug}.json`)
      headers.location.should.equal(`${host}/api/groups?action=by-slug&slug=${slug}`)
    })
  })
})
