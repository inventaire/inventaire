const { shouldNotBeCalled } = require('tests/api/utils/utils')
const { publicReq, authReq, authReqB, getUser, customAuthReq } = require('../utils/utils')
const { createUser, getTwoFriends } = require('../fixtures/users')
const { createList } = require('../fixtures/lists')
const { makeFriends } = require('../utils/relations')
const { getSomeGroupWithAMember } = require('tests/api/fixtures/groups')

const endpoint = '/api/lists?action=by-ids'

describe('lists:visibility', () => {
  describe('public', () => {
    it('should get a public list', async () => {
      const { list } = await createList()
      list.visibility.should.deepEqual([ 'public' ])
      const { lists } = await publicReq('get', `${endpoint}&ids=${list._id}`)
      lists[list._id].should.be.an.Object()
    })
  })

  describe('private', () => {
    it('should return user private lists', async () => {
      const { list } = await createList(null, { visibility: [] })
      const res = await authReq('get', `${endpoint}&ids=${list._id}`)
      const resIds = Object.keys(res.lists)
      resIds.should.containEql(list._id)
    })

    it('should not return a private list to an authentified user', async () => {
      const { list } = await createList(null, { visibility: [] })
      await authReqB('get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should not return a private list to a friend', async () => {
      const friend = await createUser()
      const user = await getUser()
      await makeFriends(friend, user)
      const { list } = await createList(null, { visibility: [] })
      await customAuthReq(friend, 'get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })

    it('should not return a private list to a non-authentified user', async () => {
      const { list } = await createList(null, { visibility: [] })
      await publicReq('get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(401)
      })
    })
  })

  describe('friends', () => {
    it('should return a friends-only list to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { list } = await createList(userA, { visibility: [ 'friends' ] })
      const res = await customAuthReq(userB, 'get', `${endpoint}&ids=${list._id}`)
      res.lists[list._id].should.be.ok()
    })

    it('should not return a friends-only list to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { list } = await createList(memberA, { visibility: [ 'friends' ] })
      await customAuthReq(memberB, 'get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  describe('groups', () => {
    it('should return a groups-only list to a group co-member', async () => {
      const { member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { list } = await createList(memberA, { visibility: [ 'groups' ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&ids=${list._id}`)
      res.lists[list._id].should.be.ok()
    })

    it('should not return a groups-only list to a friend', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const { list } = await createList(userA, { visibility: [ 'groups' ] })
      await customAuthReq(userB, 'get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  describe('group', () => {
    it('should return a group-allowed list to a group member', async () => {
      const { group, member: memberA, admin: memberB } = await getSomeGroupWithAMember()
      const { list } = await createList(memberA, { visibility: [ `group:${group._id}` ] })
      const res = await customAuthReq(memberB, 'get', `${endpoint}&ids=${list._id}`)
      const resIds = Object.keys(res.lists)
      resIds.should.containEql(list._id)
    })

    it('should not return a group-allowed list to a friend', async () => {
      const [ user, { group, member } ] = await Promise.all([
        createUser(),
        getSomeGroupWithAMember()
      ])
      await makeFriends(user, member)
      const { list } = await createList(member, { visibility: [ `group:${group._id}` ] })
      await customAuthReq(user, 'get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })
})
