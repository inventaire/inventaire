import 'should'
import { getSomeGroup } from '#fixtures/groups'
import { createShelf } from '#fixtures/shelves'
import { rawRequest } from '#tests/api/utils/request'
import { getUser } from '#tests/api/utils/utils'

describe('rss redirections', () => {
  it('should redirect to a user feed by id', async () => {
    const { _id } = await getUser()
    const { headers } = await rawRequest('get', `/users/${_id}.rss`)
    headers.location.should.equal(`/api/feeds?user=${_id}`)
  })

  it('should redirect to a user feed by username', async () => {
    const { _id, username } = await getUser()
    const { headers } = await rawRequest('get', `/users/${username}.rss`)
    headers.location.should.equal(`/api/feeds?user=${_id}`)
  })

  it('should redirect to a user feed by username (legacy)', async () => {
    const { _id, username } = await getUser()
    const { headers } = await rawRequest('get', `/inventory/${username}.rss`)
    headers.location.should.equal(`/api/feeds?user=${_id}`)
  })

  it('should redirect to a group feed by id', async () => {
    const { _id } = await getSomeGroup()
    const { headers } = await rawRequest('get', `/groups/${_id}.rss`)
    headers.location.should.equal(`/api/feeds?group=${_id}`)
  })

  it('should redirect to a group feed by slug', async () => {
    const { _id, slug } = await getSomeGroup()
    const { headers } = await rawRequest('get', `/groups/${slug}.rss`)
    headers.location.should.equal(`/api/feeds?group=${_id}`)
  })

  it('should redirect to a shelf feed by id', async () => {
    const { shelf } = await createShelf()
    const { _id } = shelf
    const { headers } = await rawRequest('get', `/shelves/${_id}.rss`)
    console.log('headers.location', headers.location)
    headers.location.should.equal(`/api/feeds?shelf=${_id}`)
  })
})
