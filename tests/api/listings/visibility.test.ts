import { getSomeGroupWithAMember } from '#fixtures/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { createListing } from '../fixtures/listings.js'
import { createUser, getTwoFriends } from '../fixtures/users.js'
import { makeFriends } from '../utils/relations.js'
import { publicReq, authReq, authReqB, getUser } from '../utils/utils.js'

const endpoint = '/api/lists?action=by-ids'

describe('listings:visibility', () => {
  describe('public', () => {
    it('should get a public listing', async () => {
      const { listing } = await createListing()
      listing.visibility.should.deepEqual([ 'public' ])
      const { lists } = await publicReq('get', `${endpoint}&ids=${listing._id}`)
      lists[listing._id].should.be.an.Object()
    })
  })

  describe('private', () => {
    it('should return user private listing', async () => {
      const { listing } = await createListing(null, { visibility: [] })
      const res = await authReq('get', `${endpoint}&ids=${listing._id}`)
      const resIds = Object.keys(res.lists)
      resIds.should.containEql(listing._id)
    })

    it('should not return a private listing to an authentified user', async () => {
      const { listing } = await createListing(null, { visibility: [] })
      await authReqB('get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should not return a private listing to a friend', async () => {
      const friend = await createUser()
      const user = await getUser()
      await makeFriends(friend, user)
      const { listing } = await createListing(null, { visibility: [] })
      await customAuthReq(friend, 'get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should not return a private listing to a non-authentified user', async () => {
      const { listing } = await createListing(null, { visibility: [] })
      await publicReq('get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(401)
      })
    })
  })

  describe('friends', () => {
    it('should return a friends-only listing to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { listing } = await createListing(userA, { visibility: [ 'friends' ] })
      const res = await customAuthReq(userB, 'get', `${endpoint}&ids=${listing._id}`)
      res.lists[listing._id].should.be.ok()
    })

    it('should not return a friends-only listing to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { listing } = await createListing(memberA, { visibility: [ 'friends' ] })
      await customAuthReq(memberB, 'get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  describe('groups', () => {
    it('should return a groups-only listing to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { listing } = await createListing(memberA, { visibility: [ 'groups' ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&ids=${listing._id}`)
      res.lists[listing._id].should.be.ok()
    })

    it('should not return a groups-only listing to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { listing } = await createListing(userA, { visibility: [ 'groups' ] })
      await customAuthReq(userB, 'get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  describe('group', () => {
    it('should return a group-allowed listing to a group member', async () => {
      const { group, member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { listing } = await createListing(memberA, { visibility: [ `group:${group._id}` ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&ids=${listing._id}`)
      const resIds = Object.keys(res.lists)
      resIds.should.containEql(listing._id)
    })

    it('should not return a group-allowed listing to a friend', async () => {
      const [ user, { group, member } ] = await Promise.all([
        createUser(),
        getSomeGroupWithAMember(),
      ])
      await makeFriends(user, member)
      const { listing } = await createListing(member, { visibility: [ `group:${group._id}` ] })
      await customAuthReq(user, 'get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })
})
