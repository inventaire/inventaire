import 'should'
import { createHuman } from '#fixtures/entities'
import { getSomeGroup } from '#fixtures/groups'
import { createItem } from '#fixtures/items'
import { createUser } from '#fixtures/users'
import { publicOrigin } from '#server/config'
import { rawRequest } from '#tests/api/utils/request'

const someEntityPromise = createHuman()
const someUserPromise = createUser()
const someItemPromise = createItem()

describe('json redirections', () => {
  describe('items', () => {
    it('should redirect to an item by id', async () => {
      const { _id } = await someItemPromise
      const { headers } = await rawRequest('get', `/items/${_id}.json`)
      headers.location.should.equal(`${publicOrigin}/api/items?action=by-ids&ids=${_id}`)
    })
  })

  describe('entities', () => {
    it('should redirect to an entity', async () => {
      const { _id } = await someEntityPromise
      const uri = `inv:${_id}`
      const { headers } = await rawRequest('get', `/entity/${uri}.json`)
      headers.location.should.equal(`${publicOrigin}/api/entities?action=by-uris&uris=${uri}`)
    })

    it('should redirect a claim to its entity value', async () => {
      const { _id } = await someEntityPromise
      const uri = `inv:${_id}`
      const { headers } = await rawRequest('get', `/entity/wdt:P921-${uri}.json`)
      headers.location.should.equal(`${publicOrigin}/api/entities?action=by-uris&uris=${uri}`)
    })

    it('should redirect to a local entity history', async () => {
      const { _id } = await someEntityPromise
      const uri = `inv:${_id}`
      const { headers } = await rawRequest('get', `/entity/${uri}/history.json`)
      headers.location.should.equal(`${publicOrigin}/api/entities?action=history&id=${_id}`)
    })
  })

  describe('users', () => {
    it('should redirect to a user by id', async () => {
      const { _id } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${_id}.json`)
      headers.location.should.equal(`${publicOrigin}/api/users?action=by-ids&ids=${_id}`)
    })

    it('should redirect to a user by username', async () => {
      const { username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}.json`)
      headers.location.should.equal(`${publicOrigin}/api/users?action=by-usernames&usernames=${username}`)
    })

    it("should redirect to a user's items", async () => {
      const { _id, username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}/inventory.json`)
      headers.location.should.equal(`${publicOrigin}/api/items?action=by-users&users=${_id}&include-users=true`)
    })

    it("should redirect to a user's listings", async () => {
      const { _id, username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}/lists.json`)
      headers.location.should.equal(`${publicOrigin}/api/lists?action=by-creators&users=${_id}`)
    })

    it("should redirect to a user's contributions", async () => {
      const { _id, username } = await someUserPromise
      const { headers } = await rawRequest('get', `/users/${username}/contributions.json`)
      headers.location.should.equal(`${publicOrigin}/api/entities?action=contributions&user=${_id}`)
    })

    // Legacy
    it('should redirect to a user by username from /inventory/:username', async () => {
      const { username } = await someUserPromise
      const { headers } = await rawRequest('get', `/inventory/${username}.json`)
      headers.location.should.equal(`${publicOrigin}/api/users?action=by-usernames&usernames=${username}`)
    })
  })

  describe('groups', () => {
    it('should redirect to a group by id', async () => {
      const { _id } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${_id}.json`)
      headers.location.should.equal(`${publicOrigin}/api/groups?action=by-id&id=${_id}`)
    })

    it('should redirect to a group by slug', async () => {
      const { slug } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${slug}.json`)
      headers.location.should.equal(`${publicOrigin}/api/groups?action=by-slug&slug=${slug}`)
    })

    it("should redirect to a group's items", async () => {
      const { _id, admins, members } = await getSomeGroup()
      const { headers } = await rawRequest('get', `/groups/${_id}/inventory.json`)
      const { location } = headers
      const allUsersIds = getGroupMembersIds({ admins, members })
      const parsedLocation = new URL(location)
      const { searchParams } = parsedLocation
      const paramsUsersIds = searchParams.get('users').split('|')
      parsedLocation.origin.should.equal(publicOrigin)
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
      parsedLocation.origin.should.equal(publicOrigin)
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
      headers.location.should.equal(`${publicOrigin}/api/shelves?action=by-ids&ids=${_id}&with-items=true`)
    })
  })

  describe('listings', () => {
    it('should redirect to a listing with its elements', async () => {
      const { _id } = await someUserPromise
      const { headers } = await rawRequest('get', `/lists/${_id}.json`)
      headers.location.should.equal(`${publicOrigin}/api/lists?action=by-ids&ids=${_id}&with-elements=true`)
    })
  })
})

const getGroupMembersIds = ({ admins, members }) => {
  return [
    ...admins.map(getGroupMemberId),
    ...members.map(getGroupMemberId),
  ]
}
const getGroupMemberId = ({ user }) => user
