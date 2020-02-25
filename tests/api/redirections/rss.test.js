const CONFIG = require('config')
const host = CONFIG.fullHost()
require('should')
const { rawRequest } = require('../utils/request')
const { createUser } = require('../fixtures/users')
const { groupPromise } = require('../fixtures/groups')
const someUserPromise = createUser()

describe('rss redirections', () => {
  it('should redirect to a user feed by id', async () => {
    const { _id } = await someUserPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/users/${_id}.rss`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/feeds?user=${_id}`)
  })

  it('should redirect to a user feed by username', async () => {
    const { _id, username } = await someUserPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/inventory/${username}.rss`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/feeds?user=${_id}`)
  })

  it('should redirect to a group feed by id', async () => {
    const { _id } = await groupPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/groups/${_id}.rss`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/feeds?group=${_id}`)
  })

  it('should redirect to a group feed by slug', async () => {
    const { _id, slug } = await groupPromise
    const { headers } = await rawRequest('get', {
      url: `${host}/groups/${slug}.rss`,
      followRedirect: false
    })
    headers.location.should.equal(`/api/feeds?group=${_id}`)
  })
})
