require('should')
const { createUser } = require('../fixtures/users')
const { signedReq, shouldNotBeCalled } = require('../utils/utils')
const { makeUrl, createRemoteActivityPubServerUser } = require('../utils/activitypub')
const { getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const { wait } = require('lib/promises')
const { createHuman } = require('../fixtures/entities')
const { createShelf } = require('../fixtures/shelves')
const { getActorName } = require('../utils/shelves')
const { getEntityActorName } = require('controllers/activitypub/lib/helpers')

describe('activitypub:inbox:Undo', () => {
  describe('users', () => {
    it('should repond ok if already not following', async () => {
      const { username } = await createUser({ fediversable: true })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const emitterUser = await createRemoteActivityPubServerUser()
      const res = await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: 'foo',
      })
      res.statusCode.should.equal(200)
    })

    it('should reject to undo from another actor', async () => {
      const { username } = await createUser({ fediversable: true })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const emitterUserA = await createRemoteActivityPubServerUser()
      const emitterUserB = await createRemoteActivityPubServerUser()
      await signedReq({
        emitterUser: emitterUserA,
        object: actorUrl,
        url: inboxUrl
      })
      const activities = await getFollowActivitiesByObject(username)
      const activity = activities[0]
      await signedReq({
        emitterUser: emitterUserB,
        url: inboxUrl,
        type: 'Undo',
        object: activity.externalId,
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should delete activity', async () => {
      const { username } = await createUser({ fediversable: true })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const emitterUser = await createRemoteActivityPubServerUser()
      await signedReq({
        emitterUser,
        object: actorUrl,
        url: inboxUrl
      })
      const activities = await getFollowActivitiesByObject(username)
      const activity = activities[0]
      await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: activity.externalId,
      })
      await wait(500)
      const activities2 = await getFollowActivitiesByObject(username)
      activities2.length.should.equal(0)
    })
  })

  describe('entities', () => {
    it('should delete activity', async () => {
      const { uri } = await createHuman()
      const name = getEntityActorName(uri)
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
      const emitterUser = await createRemoteActivityPubServerUser()
      await signedReq({
        emitterUser,
        object: actorUrl,
        url: inboxUrl
      })
      const activities = await getFollowActivitiesByObject(name)
      const activity = activities[0]
      await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: activity.externalId,
      })
      await wait(500)
      const activities2 = await getFollowActivitiesByObject(name)
      activities2.length.should.equal(0)
    })

    it('should accept an "object" as object', async () => {
      const { uri } = await createHuman()
      const name = getEntityActorName(uri)
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
      const emitterUser = await createRemoteActivityPubServerUser()
      await signedReq({
        emitterUser,
        type: 'Follow',
        object: actorUrl,
        url: inboxUrl
      })
      const activities = await getFollowActivitiesByObject(name)
      const activity = activities[0]
      await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: {
          id: activity.externalId,
          type: 'Follow',
          actor: emitterUser.actor,
          object: actorUrl
        }
      })
      await wait(500)
      const activities2 = await getFollowActivitiesByObject(name)
      activities2.length.should.equal(0)
    })
  })

  describe('shelf', () => {
    it('should delete activity', async () => {
      const user = createUser({ fediversable: true })
      const { shelf } = await createShelf(user)
      const name = getActorName(shelf)
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
      const emitterUser = await createRemoteActivityPubServerUser()
      await signedReq({
        emitterUser,
        object: actorUrl,
        url: inboxUrl
      })
      const activities = await getFollowActivitiesByObject(name)
      const activity = activities[0]
      await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: activity.externalId,
      })
      await wait(500)
      const activities2 = await getFollowActivitiesByObject(name)
      activities2.length.should.equal(0)
    })
  })
})
