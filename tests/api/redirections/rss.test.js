const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
require('should')
const { rawRequest } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { groupPromise } = require('../fixtures/groups')

describe('rss redirections', () => {
  it('should redirect to a user feed by id', async () => {
    const { _id } = await getUser()
    const { headers } = await rawRequest('get', `/users/${_id}.rss`)
    headers.location.should.equal(`${host}/api/feeds?user=${_id}`)
  })

  it('should redirect to a user feed by username', async () => {
    const { _id, username } = await getUser()
    const { headers } = await rawRequest('get', `/inventory/${username}.rss`)
    headers.location.should.equal(`${host}/api/feeds?user=${_id}`)
  })

  it('should redirect to a group feed by id', async () => {
    const { _id } = await groupPromise
    const { headers } = await rawRequest('get', `/groups/${_id}.rss`)
    headers.location.should.equal(`${host}/api/feeds?group=${_id}`)
  })

  it('should redirect to a group feed by slug', async () => {
    const { _id, slug } = await groupPromise
    const { headers } = await rawRequest('get', `/groups/${slug}.rss`)
    headers.location.should.equal(`${host}/api/feeds?group=${_id}`)
  })
})
