const CONFIG = require('config')
const debounceTime = CONFIG.activitiesDebounceTime
require('should')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { publicReq, signedReq } = require('../utils/utils')
const { wait } = require('lib/promises')
const { makeUrl } = require('../utils/activitypub')
const requests_ = require('lib/requests')
const { createWork, createHuman, addAuthor } = require('../fixtures/entities')
const { getEntityActorName } = require('controllers/activitypub/lib/helpers')

describe('activity', () => {
  describe('users', () => {
    it('should get an activity', async () => {
      const user = await createUser({ fediversable: true })
      const { username } = user
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const { remoteHost, remoteUsername } = await signedReq({ object: actorUrl, url: inboxUrl, type: 'Follow' })
      await createItem(user)
      await wait(debounceTime + 500)
      const outboxUrl = makeUrl({ params: { action: 'outbox', name: username, offset: 0 } })
      await publicReq('get', outboxUrl)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUsername}`)
      const [ createActivity ] = inbox
      const activityUrl = createActivity.object.id
      const activityId = new URL(activityUrl).searchParams.get('id')
      const activity = await publicReq('get', `/api/activitypub?action=activity&id=${activityId}`)
      activity.id.should.equal(`${activityUrl}#create`)
      activity.type.should.equal('Create')
      activity.object.id.should.equal(activityUrl)
      activity.object.type.should.equal('Note')
      activity.object.content.should.be.a.String()
    })
  })

  describe('entities', () => {
    it('should get an activity', async () => {
      const { uri: authorUri } = await createHuman()
      const { uri: workUri } = await createWork()
      await addAuthor(workUri, authorUri)
      const actorName = getEntityActorName(authorUri)
      const outboxUrl = makeUrl({ params: { action: 'outbox', name: actorName, offset: 0 } })
      const { orderedItems } = await publicReq('get', outboxUrl)
      const activityUrl = orderedItems[0].object.id
      const activity = await publicReq('get', activityUrl)
      activity.id.should.equal(`${activityUrl}#create`)
      activity.type.should.equal('Create')
      activity.object.id.should.equal(activityUrl)
      activity.object.type.should.equal('Note')
      activity.object.content.should.be.a.String()
    })
  })
})
