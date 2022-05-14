const should = require('should')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, customAuthReq, authReq, getUserB } = require('../utils/utils')
const { createSelection } = require('../fixtures/lists')
const { makeFriends } = require('../utils/relations')
const { createUser, getTwoFriends } = require('../fixtures/users')
const { createGroupWithAMember, getSomeGroupWithAMember } = require('tests/api/fixtures/groups')

const endpoint = '/api/lists?action=by-entities'

describe('lists:by-entities', () => {
  it('should be empty without lists', async () => {
    const res = await publicReq('get', `${endpoint}&uris=inv:5157e0729573118860649f4f620e34d1`)
    res.lists.should.deepEqual({})
  })

  describe('visibility:public', () => {
    it('should reject without uris', async () => {
      try {
        const res = await authReq('get', endpoint)
        shouldNotBeCalled(res)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.body.status_verbose.should.equal('missing parameter in query: uris')
        err.statusCode.should.equal(400)
      }
    })

    it('should get public lists by their selections entities uris', async () => {
      const { selection, uri, list } = await createSelection({})
      list.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      const listsRes = res.lists[uri]
      listsRes.should.be.ok()
      const { selections } = listsRes[0]
      selections.should.be.ok()
      Object.values(selections)[0]._id.should.equal(selection._id)
    })
  })

  describe('visibility:private', () => {
    it('should return user list', async () => {
      const { uri } = await createSelection({ visibility: [] })
      const res = await authReq('get', `${endpoint}&uris=${uri}`)
      res.lists[uri].should.be.ok()
    })

    it('should not return private selections', async () => {
      const { uri } = await createSelection({ visibility: [] }, getUserB())
      const res = await authReq('get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })

    it('should not return friends private selections', async () => {
      const friendAPromise = createUser()
      const friendA = await friendAPromise
      const friendB = await createUser()
      await makeFriends(friendA, friendB)

      const { uri } = await createSelection({ visibility: [] }, getUserB())
      const res = await customAuthReq(friendAPromise, 'get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })
  })

  describe('visibility:friends', () => {
    it('should return a friends-only selection to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { uri } = await createSelection({ visibility: [ 'friends' ] }, userA)
      const res = await customAuthReq(userB, 'get', `${endpoint}&uris=${uri}`)
      res.lists[uri].should.be.ok()
    })

    it('should not return a friends-only selection to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { uri } = await createSelection({ visibility: [ 'friends' ] }, memberA)
      const res = await customAuthReq(memberB, 'get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })
  })

  describe('visibility:groups', () => {
    it('should return a groups-only selection to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { uri } = await createSelection({ visibility: [ 'groups' ] }, memberA)
      const res = await customAuthReq(memberB, 'get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).be.ok()
    })

    it('should not return a groups-only selection to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { uri } = await createSelection({ visibility: [ 'groups' ] }, userA)
      const res = await customAuthReq(userB, 'get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })
  })

  describe('visibility:group', () => {
    it('should not return a group-allowed selection to a non-member', async () => {
      const user = await createUser()
      const { group, member } = await createGroupWithAMember()
      const { uri } = await createSelection({ visibility: [ `group:${group._id}` ] }, member)
      const res = await customAuthReq(user, 'get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })

    it('should return a group-allowed selection to a member', async () => {
      const { group, member: memberA, admin: memberB } = await createGroupWithAMember()
      const { uri } = await createSelection({ visibility: [ `group:${group._id}` ] }, memberA)
      const res = await customAuthReq(memberB, 'get', `${endpoint}&uris=${uri}`)
      res.lists[uri].should.be.ok()
    })
  })
})
