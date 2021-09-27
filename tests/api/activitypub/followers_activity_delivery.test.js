const CONFIG = require('config')
const debounceTime = CONFIG.activitiesDebounceTime
require('should')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { wait } = require('lib/promises')
const { makeUrl } = require('../utils/activitypub')
const requests_ = require('lib/requests')
const { createHuman, createWork, addAuthor } = require('../fixtures/entities')
const { createShelf } = require('../fixtures/shelves')
const { rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { addItemsToShelf, getActorName } = require('../utils/shelves')

describe('followers activity delivery', () => {
  describe('users followers', () => {
    it('should post an activity to inbox', async () => {
      const user = await createUser({ fediversable: true })
      const { username } = user
      const followedActorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const { remoteHost, remoteUserId, remoteUsername } = await signedReq({
        url: inboxUrl,
        object: followedActorUrl,
        type: 'Follow',
      })
      const item = await createItem(user)
      await wait(debounceTime + 500)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUsername}`)
      const createActivity = inbox[0]
      createActivity.object.content.should.containEql(item._id)
      createActivity.to.should.deepEqual([ remoteUserId, 'Public' ])
    })
  })

  describe('entities followers', () => {
    it('should post an activity to inbox', async () => {
      const { uri: authorUri } = await createHuman()
      const { uri: workUri, _id: workId } = await createWork()
      const followedActorUrl = makeUrl({ params: { action: 'actor', name: authorUri } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: authorUri } })
      const { remoteHost, remoteUserId, remoteUsername } = await signedReq({
        url: inboxUrl,
        object: followedActorUrl,
        type: 'Follow',
      })
      await addAuthor(workUri, authorUri)
      await wait(500)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUsername}`)
      const createActivity = inbox[0]
      createActivity.type.should.equal('Create')
      createActivity.object.type.should.equal('Note')
      createActivity.object.content.should.startWith('<p>')
      new URL(createActivity.object.id).searchParams.get('id').should.containEql(workId)
      createActivity.to.should.deepEqual([ remoteUserId, 'Public' ])
    })
  })

  describe('shelves followers', () => {
    it('should reject if owner is not fediversable', async () => {
      try {
        const user = createUser({ fediversable: false })
        const { shelf } = await createShelf(user)
        const name = getActorName(shelf)

        const followedActorUrl = decodeURIComponent(makeUrl({ params: { action: 'actor', name } }))
        const inboxUrl = decodeURIComponent(makeUrl({ params: { action: 'inbox', name } }))
        await signedReq({
          url: inboxUrl,
          object: followedActorUrl,
          type: 'Follow',
        })
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
      }
    })

    it('should reject if shelf is not public', async () => {
      try {
        const user = createUser({ fediversable: true })
        const { shelf } = await createShelf(user, { listing: 'network' })
        const name = getActorName(shelf)
        const followedActorUrl = decodeURIComponent(makeUrl({ params: { action: 'actor', name } }))
        const inboxUrl = decodeURIComponent(makeUrl({ params: { action: 'inbox', name } }))
        await signedReq({
          url: inboxUrl,
          object: followedActorUrl,
          type: 'Follow',
        })
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
      }
    })

    it('should post an activity to inbox shelves followers', async () => {
      const user = createUser({ fediversable: true })
      const { shelf } = await createShelf(user)
      const name = getActorName(shelf)
      const followedActorUrl = decodeURIComponent(makeUrl({ params: { action: 'actor', name } }))
      const inboxUrl = decodeURIComponent(makeUrl({ params: { action: 'inbox', name } }))
      const res = await signedReq({
        url: inboxUrl,
        object: followedActorUrl,
        type: 'Follow',
      })
      const { remoteHost, remoteUserId, remoteUsername } = res
      const { _id: itemId } = await createItem(user)
      await addItemsToShelf(user, shelf, [ itemId ])
      await wait(debounceTime + 500)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUsername}`)
      const createActivity = inbox[0]
      createActivity.object.content.should.containEql(itemId)
      createActivity.to.should.deepEqual([ remoteUserId, 'Public' ])
    })
  })
})
