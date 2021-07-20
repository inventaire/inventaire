const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
require('should')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { publicReq } = require('../utils/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/activitypub?action=outbox&name='

describe('outbox:public', () => {
  it('reject if user is not fediversable', async () => {
    try {
      const user = createUser({ fediversable: false })
      const { username } = await user
      const outboxUrl = `${endpoint}${username}`
      await publicReq('get', outboxUrl).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(404)
      err.body.status_verbose.should.equal('user is not on the fediverse')
    }
  })

  it('should return a first page URL', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    const { username } = await user
    await wait(800)
    const outboxUrl = `${endpoint}${username}`
    const res = await publicReq('get', outboxUrl)
    const fullHostUrl = `${host}${outboxUrl}`
    res.id.should.equal(fullHostUrl)
    res.type.should.equal('OrderedCollection')
    res.totalItems.should.equal(1)
    res.first.should.equal(`${fullHostUrl}&offset=0`)
  })

  it('should return content with items link', async () => {
    const user = createUser({ fediversable: true, language: 'it' })
    const item = await createItem(user)
    await createItem(user, { listing: 'network' })
    const { username } = await user
    await wait(800)
    const outboxUrl = `${endpoint}${username}&offset=0`
    const fullHostUrl = `${host}${endpoint}${username}`
    const res = await publicReq('get', outboxUrl)
    res.type.should.equal('OrderedCollectionPage')
    res.partOf.should.equal(fullHostUrl)
    res.first.should.equal(`${fullHostUrl}&offset=0`)
    res.next.should.equal(`${fullHostUrl}&offset=10`)
    res.totalItems.should.equal(1)
    res.orderedItems.should.be.an.Array()
    res.orderedItems.length.should.equal(1)
    res.orderedItems[0].object.content.should.containEql(item._id)
    // res.orderedItems[0].object.contentMap.it.should.be.a.String()
  })
})
