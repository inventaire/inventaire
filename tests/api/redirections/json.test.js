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

    it("should redirect to a user's items", async () => {
      const { _id, username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}/inventory.json`)
      headers.location.should.equal(`${host}/api/items?action=by-users&users=${_id}&include-users=true`)
    })

    it("should redirect to a user's listings", async () => {
      const { _id, username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}/lists.json`)
      headers.location.should.equal(`${host}/api/lists?action=by-creators&users=${_id}`)
    })

    it("should redirect to a user's contributions", async () => {
      const { _id, username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}/contributions.json`)
      headers.location.should.equal(`${host}/api/entities?action=contributions&user=${_id}`)
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

    it("should redirect to a group's items", async () => {
      const { _id, admins, members } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${_id}/inventory.json`)
      const { location } = headers
      const allUsersIds = getGroupMembersIds({ admins, members })
      const parsedLocation = new URL(location)
      const { searchParams } = parsedLocation
      const paramsUsersIds = searchParams.get('users').split('|')
      parsedLocation.origin.should.equal(host)
      parsedLocation.pathname.should.equal('/api/items')
      searchParams.get('action').should.equal('by-users')
      searchParams.get('filter').should.equal('group')
      paramsUsersIds.length.should.equal(allUsersIds.length)
      paramsUsersIds.every(userId => allUsersIds.includes(userId))
    })

    it("should redirect to a group's listings", async () => {
      const { slug, admins, members } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${slug}/lists.json`)
      const { location } = headers
      const allUsersIds = getGroupMembersIds({ admins, members })
      const parsedLocation = new URL(location)
      const { searchParams } = parsedLocation
      const paramsUsersIds = searchParams.get('users').split('|')
      parsedLocation.origin.should.equal(host)
      parsedLocation.pathname.should.equal('/api/lists')
      searchParams.get('action').should.equal('by-creators')
      paramsUsersIds.length.should.equal(allUsersIds.length)
      paramsUsersIds.every(userId => allUsersIds.includes(userId))
    })
  })

  describe('shelves', () => {
    it('should redirect to a shelf with its items', async () => {
      const { _id } = await someUserPromise
      const { headers } = await rawRequest('get', `/shelves/${_id}.json`)
      headers.location.should.equal(`${host}/api/shelves?action=by-ids&ids=${_id}&with-items=true`)
    })
  })
})

const getGroupMembersIds = ({ admins, members }) => {
  return admins.map(getGroupMemberId)
  .concat(members.map(getGroupMemberId))
}
const getGroupMemberId = ({ user }) => user
