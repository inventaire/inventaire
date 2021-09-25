const CONFIG = require('config')
const debounceTime = CONFIG.activitiesDebounceTime
require('should')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { signedReq } = require('../utils/utils')
const { wait } = require('lib/promises')
const { makeUrl, createRemoteActivityPubServerUser } = require('../utils/activitypub')
const requests_ = require('lib/requests')
const { createHuman, createWork, addAuthor } = require('../fixtures/entities')

describe('followers activity delivery', () => {
  describe('users followers', () => {
    it('should post an activity to inbox', async () => {
      const user = await createUser({ fediversable: true })
      const { username } = user
      const remoteUser = await createRemoteActivityPubServerUser()
      const followedActorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const { remoteHost } = await signedReq({
        url: inboxUrl,
        object: followedActorUrl,
        type: 'Follow',
        emitterUser: remoteUser
      })
      const item = await createItem(user)
      await wait(debounceTime + 500)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUser.username}`)
      const createActivity = inbox[0]
      createActivity.object.content.should.containEql(item._id)
      createActivity.to.should.deepEqual([ remoteUser.id, 'Public' ])
    })
  })

  describe('entities followers', () => {
    it('should post an activity to inbox', async () => {
      const { uri: authorUri, labels: authorLabels } = await createHuman()
      const { uri: workUri, labels: workLabels } = await createWork()
      const followedActorUrl = makeUrl({ params: { action: 'actor', name: authorUri } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: authorUri } })
      const remoteUser = await createRemoteActivityPubServerUser()
      const { remoteHost } = await signedReq({
        url: inboxUrl,
        object: followedActorUrl,
        type: 'Follow',
        emitterUser: remoteUser
      })
      await addAuthor(workUri, authorUri)
      await wait(500)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUser.username}`)
      const createActivity = inbox[0]
      createActivity.object.content.should.containEql(authorLabels.en)
      createActivity.object.content.should.containEql(workLabels.en)
      createActivity.to.should.deepEqual([ remoteUser.id, 'Public' ])
    })
  })
})
