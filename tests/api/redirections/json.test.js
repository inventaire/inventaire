const CONFIG = require('config')
const host = CONFIG.fullHost()
require('should')
const { rawRequest } = require('../utils/request')
const { createHuman } = require('../fixtures/entities')
const { createUser } = require('../fixtures/users')
const { groupPromise } = require('../fixtures/groups')
const { createItem } = require('../fixtures/items')
const someEntityPromise = createHuman()
const someUserPromise = createUser()
const someItemPromise = createItem()

describe('json redirections', () => {
  it('should redirect to an entity', async () => {
    const { _id } = await someEntityPromise
    const uri = `inv:${_id}`
    const { headers } = await rawRequest('get', {
      url: `${host}/entity/${uri}.json`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/entities?action=by-uris&uris=${uri}`)
  })

  it('should redirect to a user by id', async () => {
    const { _id } = await someUserPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/users/${_id}.json`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/users?action=by-ids&ids=${_id}`)
  })

  it('should redirect to a user by username', async () => {
    const { username } = await someUserPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/inventory/${username}.json`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/users?action=by-usernames&usernames=${username}`)
  })

  it('should redirect to a group by id', async () => {
    const { _id } = await groupPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/groups/${_id}.json`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/groups?action=by-id&id=${_id}`)
  })

  it('should redirect to a group by slug', async () => {
    const { slug } = await groupPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/groups/${slug}.json`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/groups?action=by-slug&slug=${slug}`)
  })

  it('should redirect to an item by id', async () => {
    const { _id } = await someItemPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/items/${_id}.json`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/items?action=by-ids&ids=${_id}`)
  })
})
