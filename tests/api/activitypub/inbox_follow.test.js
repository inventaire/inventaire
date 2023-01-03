import 'should'
import { getFollowActivitiesByObject } from '#controllers/activitypub/lib/activities'
import { getEntityActorName, makeUrl } from '#controllers/activitypub/lib/helpers'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createHuman } from '../fixtures/entities.js'
import { createShelf } from '../fixtures/shelves.js'
import { createUser } from '../fixtures/users.js'
import { signedReq, createRemoteActivityPubServerUser } from '../utils/activitypub.js'
import { getActorName } from '../utils/shelves.js'

describe('activitypub:inbox:Follow', () => {
  describe('users', () => {
    it('should reject if user is not on the fediverse', async () => {
      try {
        const { username } = await createUser({ fediversable: false })
        const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
        const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
        await signedReq({
          object: actorUrl,
          url: inboxUrl,
        })
        .then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        const parsedBody = JSON.parse(err.body)
        parsedBody.status_verbose.should.equal('user is not on the fediverse')
        parsedBody.status.should.equal(404)
      }
    })

    it('should create a Follow activity', async () => {
      const { username } = await createUser({ fediversable: true })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const res = await signedReq({
        object: actorUrl,
        url: inboxUrl,
      })
      res.statusCode.should.equal(200)
      const activities = await getFollowActivitiesByObject(username)
      activities.length.should.equal(1)
    })

    it('should not recreate a Follow activity if actor is already following someone', async () => {
      const emitterUser = await createRemoteActivityPubServerUser()
      const { username } = await createUser({ fediversable: true })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const requestPromise = signedReq({
        emitterUser,
        object: actorUrl,
        url: inboxUrl,
      })
      await requestPromise
      await wait(500)
      await requestPromise
      const activities = await getFollowActivitiesByObject(username)
      activities.length.should.equal(1)
    })

    it('should trigger an Accept activity', async () => {
      const { username } = await createUser({ fediversable: true })
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const { remoteHost, remoteUsername } = await signedReq({
        object: actorUrl,
        url: inboxUrl,
      })
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${remoteUsername}`)
      inbox.length.should.equal(1)
      const activity = inbox[0]
      activity['@context'].should.deepEqual([ 'https://www.w3.org/ns/activitystreams' ])
      activity.type.should.equal('Accept')
      activity.actor.should.equal(actorUrl)
      activity.object.should.startWith(remoteHost)
    })
  })

  describe('entities', () => {
    it('should reject if entity is not found', async () => {
      try {
        const name = 'inv-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const actorUrl = makeUrl({ params: { action: 'actor', name } })
        const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
        await signedReq({
          object: actorUrl,
          url: inboxUrl,
        })
        .then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        const parsedBody = JSON.parse(err.body)
        parsedBody.status.should.equal(404)
      }
    })

    it('should create a Follow activity', async () => {
      const { uri } = await createHuman()
      const name = getEntityActorName(uri)
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
      const res = await signedReq({
        object: actorUrl,
        url: inboxUrl,
      })
      res.statusCode.should.equal(200)
      const activities = await getFollowActivitiesByObject(name)
      activities.length.should.equal(1)
    })
  })

  describe('shelf', () => {
    it('should create a Follow activity', async () => {
      const user = createUser({ fediversable: true })
      const { shelf } = await createShelf(user)
      const name = getActorName(shelf)
      const actorUrl = makeUrl({ params: { action: 'actor', name } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
      const res = await signedReq({
        object: actorUrl,
        url: inboxUrl,
      })
      res.statusCode.should.equal(200)
      const activities = await getFollowActivitiesByObject(name)
      activities.length.should.equal(1)
    })
  })
})
