const should = require('should')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, customAuthReq, authReq, getUser, getUserB } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')
const { makeFriends } = require('../utils/relations')
const { createUser, getTwoFriends } = require('../fixtures/users')
const { createGroupWithAMember, getSomeGroupWithAMember } = require('tests/api/fixtures/groups')

const endpoint = '/api/shelves?action=by-owners'

describe('shelves:by-owners', () => {
  describe('visibility:public', () => {
    it('should reject without owners', async () => {
      try {
        const res = await authReq('get', endpoint)
        shouldNotBeCalled(res)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.body.status_verbose.should.equal('missing parameter in query: owners')
        err.statusCode.should.equal(400)
      }
    })

    it('should get a public shelf', async () => {
      const { shelf } = await createShelf()
      shelf.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&owners=${shelf.owner}`)
      res.shelves[shelf._id].should.be.ok()
    })
  })

  describe('visibility:private', () => {
    it('should return user shelf', async () => {
      const { shelf } = await createShelf(null, { visibility: [] })
      const user = await getUser()
      const res = await authReq('get', `${endpoint}&owners=${user._id}`)
      res.shelves[shelf._id].should.be.ok()
    })

    it('should not return private shelves', async () => {
      const { shelf } = await createShelf(getUserB(), { visibility: [] })
      const user = await getUserB()
      const res = await authReq('get', `${endpoint}&owners=${user._id}`)
      should(res.shelves[shelf._id]).not.be.ok()
    })

    it('should not return friends private shelves', async () => {
      const friendA = await createUser()
      const friendB = await createUser()
      await makeFriends(friendA, friendB)

      const { shelf } = await createShelf(friendB, { visibility: [] })
      const { _id: friendBId } = await friendB
      const res = await authReq('get', `${endpoint}&owners=${friendBId}`)
      should(res.shelves[shelf._id]).not.be.ok()
    })
  })

  describe('visibility:network', () => {
    it('should not return non friends network shelves', async () => {
      const friendA = await createUser()
      const friendB = await createUser()
      const { shelf } = await createShelf(friendB, { visibility: [ 'network' ] })
      const { _id: friendBId } = await friendB
      const res = await customAuthReq(friendA, 'get', `${endpoint}&owners=${friendBId}`)
      should(res.shelves[shelf._id]).not.be.ok()
    })

    it('should return friends network shelves', async () => {
      const friendA = await createUser()
      const friendB = await createUser()
      await makeFriends(friendA, friendB)
      const { shelf } = await createShelf(friendB, { visibility: [ 'network' ] })
      const { _id: friendBId } = await friendB
      const res = await customAuthReq(friendA, 'get', `${endpoint}&owners=${friendBId}`)
      res.shelves[shelf._id].should.be.ok()
    })
  })

  describe('visibility:friends', () => {
    it('should return a friends-only shelf to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { shelf } = await createShelf(userA, { visibility: [ 'friends' ] })
      const res = await customAuthReq(userB, 'get', `${endpoint}&owners=${userA._id}`)
      res.shelves[shelf._id].should.be.ok()
    })

    it('should not return a friends-only shelf to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { shelf } = await createShelf(memberA, { visibility: [ 'friends' ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&owners=${memberA._id}`)
      should(res.shelves[shelf._id]).not.be.ok()
    })
  })

  describe('visibility:groups', () => {
    it('should return a groups-only shelf to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { shelf } = await createShelf(memberA, { visibility: [ 'groups' ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&owners=${memberA._id}`)
      should(res.shelves[shelf._id]).be.ok()
    })

    it('should not return a groups-only shelf to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { shelf } = await createShelf(userA, { visibility: [ 'groups' ] })
      const res = await customAuthReq(userB, 'get', `${endpoint}&owners=${userA._id}`)
      should(res.shelves[shelf._id]).not.be.ok()
    })
  })

  describe('visibility:group', () => {
    it('should not return a group-allowed shelf to a non-member', async () => {
      const user = await createUser()
      const { group, member } = await createGroupWithAMember()
      const { shelf } = await createShelf(member, { visibility: [ `group:${group._id}` ] })
      const res = await customAuthReq(user, 'get', `${endpoint}&owners=${member._id}`)
      should(res.shelves[shelf._id]).not.be.ok()
    })

    it('should return a group-allowed shelf to a member', async () => {
      const { group, member: memberA, admin: memberB } = await createGroupWithAMember()
      const { shelf } = await createShelf(memberA, { visibility: [ `group:${group._id}` ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&owners=${memberA._id}`)
      res.shelves[shelf._id].should.be.ok()
    })
  })
})
