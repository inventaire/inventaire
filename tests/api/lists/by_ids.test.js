const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, authReq, authReqB, getUser, customAuthReq } = require('../utils/utils')
const { createUser, getTwoFriends } = require('../fixtures/users')
const { createList } = require('../fixtures/lists')
const { makeFriends } = require('../utils/relations')
const { getSomeGroupWithAMember } = require('tests/api/fixtures/groups')
const { someCouchUuid } = require('tests/api/fixtures/general')

const endpoint = '/api/lists?action=by-ids'

describe('lists:by-ids', () => {
  it('should reject without ids', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should be empty when the id does not exist', async () => {
    await publicReq('get', `${endpoint}&ids=${someCouchUuid}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })

  describe('visibility:public', () => {
    it('should get a public list', async () => {
      const { list } = await createList()
      list.visibility.should.deepEqual([ 'public' ])
      const { lists } = await publicReq('get', `${endpoint}&ids=${list._id}`)
      lists[list._id].should.be.an.Object()
    })
  })

  describe('visibility:private', () => {
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

  describe('visibility:friends', () => {
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

  describe('visibility:groups', () => {
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

  describe('visibility:group', () => {
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

  it('should set warnings when some requested lists can not be returned', async () => {
    const [ { list: privatelist }, { list: publiclist } ] = await Promise.all([
      createList(null, { visibility: [] }),
      createList(null, { visibility: [ 'public' ] }),
    ])
    const ids = [ someCouchUuid, privatelist._id, publiclist._id ]
    const res = await publicReq('get', `${endpoint}&ids=${ids.join('|')}`)
    Object.keys(res.lists).should.deepEqual([ publiclist._id ])
    res.warnings.should.containEql(`lists not found: ${someCouchUuid}`)
    res.warnings.should.containEql(`unauthorized lists access: ${privatelist._id}`)
  })
})
