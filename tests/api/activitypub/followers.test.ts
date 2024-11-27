import 'should'
import { getEntityActorName, makeUrl } from '#controllers/activitypub/lib/helpers'
import { createHuman } from '#fixtures/entities'
import { createShelf, createShelfWithItem } from '#fixtures/shelves'
import { createUser } from '#fixtures/users'
import { publicOrigin } from '#server/config'
import { signedReq } from '#tests/api/utils/activitypub'
import { getActorName } from '#tests/api/utils/shelves'
import { publicReq, getFediversableUser } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'
import type { ObjectType } from '#types/activity'
import type { Url } from '#types/common'

const endpoint = '/api/activitypub?action=followers&name='

async function createFollowActivity (name) {
  const followedActorUrl = makeUrl({ params: { action: 'actor', name } }) as ObjectType
  const inboxUrl = makeUrl({ params: { action: 'inbox', name } })
  return signedReq({
    url: inboxUrl,
    object: followedActorUrl,
    type: 'Follow',
  })
}

describe('followers', () => {
  describe('users', () => {
    it('reject if user is not fediversable', async () => {
      try {
        const user = createUser({ fediversable: false })
        const { username } = await user
        const followersUrl: Url = `${endpoint}${username}`
        await publicReq('get', followersUrl).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
        err.body.status_verbose.should.equal('user is not on the fediverse')
      }
    })

    it('should paginate followers URLs', async () => {
      const user = await createUser({ fediversable: true })
      const { username } = await user
      const { remoteUserId } = await createFollowActivity(username)
      const firstfollowersPage: Url = `${endpoint}${username}&offset=0`
      const res1 = await publicReq('get', firstfollowersPage)
      res1.orderedItems.length.should.equal(1)
      res1.orderedItems[0].should.equal(remoteUserId)

      const { remoteUserId: remoteUserId2 } = await createFollowActivity(username)
      const nextfollowersPage: Url = `${endpoint}${username}&offset=0`
      const res2 = await publicReq('get', nextfollowersPage)
      res2.orderedItems[0].should.equal(remoteUserId2)

      const firstfollowersPage2: Url = `${endpoint}${username}&offset=1`
      const res3 = await publicReq('get', firstfollowersPage2)
      res3.orderedItems[0].should.equal(remoteUserId)
    })
  })

  describe('entities', () => {
    it('should return a first page URL', async () => {
      const { uri: authorUri } = await createHuman()
      await createFollowActivity(authorUri)
      const followersUrl: Url = `${endpoint}${getEntityActorName(authorUri)}`
      const res = await publicReq('get', followersUrl)
      const url = `${publicOrigin}${followersUrl}`
      res.id.should.equal(url)
      res.type.should.equal('OrderedCollection')
      res.totalItems.should.equal(1)
      res.first.should.equal(`${url}&offset=0`)
      res.next.should.equal(`${url}&offset=0`)
    })

    it('should return entity followers URLs', async () => {
      const { uri: authorUri } = await createHuman()
      const { remoteUserId } = await createFollowActivity(authorUri)
      const followersUrl: Url = `${endpoint}${getEntityActorName(authorUri)}`
      const res = await publicReq('get', `${followersUrl}&offset=0`)
      const url = `${publicOrigin}${followersUrl}`
      res.type.should.equal('OrderedCollectionPage')
      res.partOf.should.equal(url)
      res.first.should.equal(`${url}&offset=0`)
      res.next.should.equal(`${url}&offset=10`)
      res.orderedItems.should.be.an.Array()
      res.orderedItems[0].should.equal(remoteUserId)
    })
  })

  describe('shelves', () => {
    it('reject invalid shelf id', async () => {
      try {
        const followersUrl: Url = `${endpoint}shelf-foo`
        await publicReq('get', followersUrl).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('invalid shelf id')
      }
    })

    it("reject if shelf's owner is not fediversable", async () => {
      try {
        const user = createUser({ fediversable: false })
        const { shelf } = await createShelf(user)
        const name = getActorName(shelf)
        const followersUrl: Url = `${endpoint}${name}`
        await publicReq('get', followersUrl).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
        err.body.status_verbose.should.equal("shelf's owner is not on the fediverse")
      }
    })

    it('should not return network shelf', async () => {
      try {
        const user = createUser({ fediversable: true })
        const { shelf } = await createShelf(user, { visibility: [ 'friends' ] })
        const name = getActorName(shelf)
        const followersUrl: Url = `${endpoint}${name}`
        await publicReq('get', followersUrl).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
        err.body.status_verbose.should.equal('not found')
      }
    })

    it('should return a first page URL', async () => {
      const { shelf } = await createShelfWithItem({}, null, getFediversableUser())
      const name = getActorName(shelf)
      await createFollowActivity(name)
      const followersUrl: Url = `${endpoint}${name}`
      const res = await publicReq('get', followersUrl)
      const url = `${publicOrigin}${followersUrl}`
      res.id.should.equal(url)
      res.type.should.equal('OrderedCollection')
      res.totalItems.should.equal(1)
      res.first.should.equal(`${url}&offset=0`)
      res.next.should.equal(`${url}&offset=0`)
    })

    it('should return followers URLs', async () => {
      const { shelf } = await createShelfWithItem({}, null, getFediversableUser())
      const name = getActorName(shelf)
      const { remoteUserId } = await createFollowActivity(name)
      const followersUrl: Url = `${endpoint}${name}&offset=0`
      const res = await publicReq('get', followersUrl)
      const url = `${publicOrigin}${endpoint}${name}`
      res.type.should.equal('OrderedCollectionPage')
      res.partOf.should.equal(url)
      res.first.should.equal(`${url}&offset=0`)
      res.next.should.equal(`${url}&offset=10`)
      res.orderedItems.should.be.an.Array()
      res.orderedItems[0].should.equal(remoteUserId)
    })
  })
})
