require('should')
const { createUser } = require('../fixtures/users')
const { signedReq, shouldNotBeCalled } = require('../utils/utils')
const { makeUrl, createRemoteActivityPubServerUser } = require('../utils/activitypub')
const { getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const { wait } = require('lib/promises')
const { createHuman } = require('../fixtures/entities')

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
      const actorUrl = makeUrl({ params: { action: 'actor', name: uri } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: uri } })
      const emitterUser = await createRemoteActivityPubServerUser()
      await signedReq({
        emitterUser,
        object: actorUrl,
        url: inboxUrl
      })
      const activities = await getFollowActivitiesByObject(uri)
      const activity = activities[0]
      await signedReq({
        emitterUser,
        url: inboxUrl,
        type: 'Undo',
        object: activity.externalId,
      })
      await wait(500)
      const activities2 = await getFollowActivitiesByObject(uri)
      activities2.length.should.equal(0)
    })
  })
})
