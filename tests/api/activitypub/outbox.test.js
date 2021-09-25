const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const debounceTime = CONFIG.activitiesDebounceTime
require('should')
const { createItem, createItems } = require('../fixtures/items')
const { update: updateItem } = require('../utils/items')
const { createUser } = require('../fixtures/users')
const { publicReq, customAuthReq } = require('../utils/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/activitypub?action=outbox&name='
const { makeUrl } = require('../utils/activitypub')
const { createWork, createHuman, addAuthor } = require('../fixtures/entities')

describe('outbox', () => {
  describe('users', () => {
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

    it('should paginate activities', async () => {
      const user = createUser({ fediversable: true })
      const itemA = await createItem(user)
      await wait(debounceTime + 500)
      const itemB = await createItem(user)
      await wait(debounceTime + 500)
      const { username } = await user
      const firstOutboxPage = `${endpoint}${username}&offset=0&limit=1`
      const res1 = await publicReq('get', firstOutboxPage)
      res1.orderedItems.length.should.equal(1)
      res1.orderedItems[0].object.content.should.containEql(itemB._id)
      const nextOutboxPage = `${endpoint}${username}&offset=1&limit=1`
      const res2 = await publicReq('get', nextOutboxPage)
      res2.orderedItems.length.should.equal(1)
      res2.orderedItems[0].object.content.should.containEql(itemA._id)
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
      res.orderedItems.should.be.an.Array()
      res.orderedItems.length.should.equal(1)
      const createActivity = res.orderedItems[0]
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const activityEndpoint = makeUrl({ params: { action: 'activity' } })
      createActivity.id.should.startWith(activityEndpoint)
      createActivity.actor.should.equal(actorUrl)
      createActivity.object.content.should.containEql(item._id)
      createActivity.to.should.containEql('Public')
      createActivity.object.attachment.should.be.an.Array()
    })

    it('should not return network items', async () => {
      const user = createUser({ fediversable: true })
      await createItem(user, { listing: 'network' })
      const { username } = await user
      await wait(debounceTime)
      const outboxUrl = `${endpoint}${username}&offset=0`
      const res = await publicReq('get', outboxUrl)
      res.orderedItems.length.should.equal(0)
    })

    describe('update:items', () => {
      it('should not create an activity if another activity already has item id', async () => {
        // meaning updating any item attribute wont trigger any activity
        const user = createUser({ fediversable: true })
        const item = await createItem(user)
        const { username } = await user
        const outboxUrl = `${endpoint}${username}&offset=0`
        await wait(debounceTime + 500)
        item.transaction = 'lending'
        await customAuthReq(user, 'put', '/api/items', item)
        await wait(debounceTime + 500)
        const res = await publicReq('get', outboxUrl)
        res.orderedItems.length.should.equal(1)
      })

      it('should including an item previously private after it was updated to public', async () => {
        const user = createUser({ fediversable: true })
        const [ publicItem, privateItem ] = await createItems(user, [ { listing: 'public' }, { listing: 'private' } ])
        await wait(debounceTime + 500)
        const { username } = await user
        const outboxUrl = `${endpoint}${username}&offset=0`
        const res1 = await publicReq('get', outboxUrl)
        res1.orderedItems.length.should.equal(1)
        res1.orderedItems[0].object.content.should.containEql(publicItem._id)
        res1.orderedItems[0].object.content.should.not.containEql(privateItem._id)
        await updateItem({ user, ids: privateItem._id, attribute: 'listing', value: 'public' })
        await wait(debounceTime + 500)
        const res2 = await publicReq('get', outboxUrl)
        res2.orderedItems.length.should.equal(1)
        res2.orderedItems[0].object.content.should.containEql(publicItem._id)
        res2.orderedItems[0].object.content.should.containEql(privateItem._id)
      })
    })

    describe('create:items', () => {
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
  })

  describe('entities', () => {
    it('should return a first page URL', async () => {
      const { uri: authorUri } = await createHuman()
      const { uri: workUri } = await createWork()
      await addAuthor(workUri, authorUri)
      const outboxUrl = `${endpoint}${authorUri}`
      const res = await publicReq('get', outboxUrl)
      const fullHostUrl = `${host}${outboxUrl}`
      decodeURIComponent(res.id).should.equal(fullHostUrl)
      res.type.should.equal('OrderedCollection')
      res.totalItems.should.equal(1)
      decodeURIComponent(res.first).should.equal(`${fullHostUrl}&offset=0`)
      decodeURIComponent(res.next).should.equal(`${fullHostUrl}&offset=0`)
    })

    it('should return entities activities', async () => {
      const { uri: authorUri, labels: authorLabels } = await createHuman()
      const { uri: workUri, labels: workLabels } = await createWork()
      await addAuthor(workUri, authorUri)
      const outboxUrl = `${endpoint}${authorUri}`
      await wait(500)
      const res = await publicReq('get', `${outboxUrl}&offset=0`)
      const fullHostUrl = `${host}${outboxUrl}`
      res.type.should.equal('OrderedCollectionPage')
      decodeURIComponent(res.partOf).should.equal(fullHostUrl)
      decodeURIComponent(res.first).should.equal(`${fullHostUrl}&offset=0`)
      decodeURIComponent(res.next).should.equal(`${fullHostUrl}&offset=10`)
      res.orderedItems.should.be.an.Array()
      res.orderedItems.length.should.equal(1)
      const createActivity = res.orderedItems[0]
      const actorUrl = makeUrl({ params: { action: 'actor', name: authorUri } })
      const activityEndpoint = makeUrl({ params: { action: 'activity' } })
      createActivity.id.should.startWith(activityEndpoint)
      createActivity.actor.should.equal(actorUrl)
      createActivity.object.content.should.containEql(authorLabels.en)
      createActivity.object.content.should.containEql(workLabels.en)
      createActivity.to.should.containEql('Public')
    })

    it('should paginate activities', async () => {
      const { uri: authorUri } = await createHuman()
      const { uri: workUri, labels: workLabels1 } = await createWork()
      const { uri: workUri2, labels: workLabels2 } = await createWork()
      await addAuthor(workUri, authorUri)
      await addAuthor(workUri2, authorUri)
      const outboxUrl = `${endpoint}${authorUri}`
      await wait(500)
      const res1 = await publicReq('get', `${outboxUrl}&offset=0&limit=1`)
      res1.orderedItems.length.should.equal(1)
      res1.orderedItems[0].object.content.should.containEql(workLabels2.en)
      const res2 = await publicReq('get', `${outboxUrl}&offset=1&limit=1`)
      res2.orderedItems.length.should.equal(1)
      res2.orderedItems[0].object.content.should.containEql(workLabels1.en)
    })
  })
})
