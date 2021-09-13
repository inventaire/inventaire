const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const debounceTime = CONFIG.activitiesDebounceTime
require('should')
const { createItem, createItems } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { publicReq, signedReq } = require('../utils/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/activitypub?action=outbox&name='
const { makeUrl } = require('../utils/activitypub')
const requests_ = require('lib/requests')

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
      err.body.status_verbose.should.equal('not found')
    }
  })

  it('should return a first page URL', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    const { username } = await user
    await wait(debounceTime + 500)
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
    const { username } = await user
    await wait(debounceTime + 500)
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

  it('should not return network items', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user, { listing: 'network' })
    const { username } = await user
    await wait(debounceTime)
    const outboxUrl = `${endpoint}${username}&offset=0`
    const res = await publicReq('get', outboxUrl)
    res.totalItems.should.equal(0)
    res.orderedItems.length.should.equal(0)
  })
})

describe('create:items:activity', () => {
  it('should return an activity when creating items in bulk', async () => {
    const user = createUser({ fediversable: true })
    await createItems(user, [ { listing: 'public' }, { listing: 'public' } ])
    const { username } = await user
    const outboxUrl = `${endpoint}${username}&offset=0`
    await wait(debounceTime + 500)
    const res = await publicReq('get', outboxUrl)
    res.orderedItems.length.should.equal(1)
  })

  it('should return an activity when creating items sequentially', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    await createItem(user)
    const { username } = await user
    const outboxUrl = `${endpoint}${username}&offset=0`
    await wait(debounceTime + 500)
    const res = await publicReq('get', outboxUrl)
    res.orderedItems.length.should.equal(1)
  })

  it('should return several activities when creating items at a different time', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    await wait(debounceTime)
    await createItem(user)
    const { username } = await user
    const outboxUrl = `${endpoint}${username}&offset=0`
    await wait(debounceTime + 500)
    const res = await publicReq('get', outboxUrl)
    res.orderedItems.length.should.equal(2)
  })

  it('should not return recent activities', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    const { username } = await user
    const outboxUrl = `${endpoint}${username}&offset=0`
    const res = await publicReq('get', outboxUrl)
    res.orderedItems.length.should.equal(0)
  })
})

describe('post:activity:remote:inbox', () => {
  it('should post an activity to inbox', async () => {
    const user = await createUser({ fediversable: true })
    const { username } = user
    const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
    const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
    // Follow user
    const { remoteHost } = await signedReq({ object: actorUrl, url: inboxUrl })
    await createItem(user)
    await wait(debounceTime)
    const outboxUrl = `${endpoint}${username}&offset=0`
    await publicReq('get', outboxUrl)
    const visitsCount = await requests_.get(`${remoteHost}/visits_count`)
    visitsCount.inbox.should.equal(1)
  })
})
