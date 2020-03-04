const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { customAuthReq, authReq, getUser, getUserB } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')
const { makeFriends } = require('../utils/relations')
const { createUser } = require('../fixtures/users')

const endpoint = '/api/shelves?action=by-owners'

describe('shelves:by-owners', () => {
  describe('listing:public', () => {
    it('should reject without owners', async () => {
      try {
        const res = await authReq('get', endpoint)
        shouldNotGetHere(res)
      } catch (err) {
        rethrowShouldNotGetHereErrors(err)
        err.body.status_verbose.should.equal('missing parameter in query: owners')
        err.statusCode.should.equal(400)
      }
    })

    it('should return shelves items when passing with-items params', async () => {
      await createShelf()
      const user = await getUser()
      const res = await authReq('get', `${endpoint}&owners=${user._id}&with-items=true`)
      _.values(res.shelves)[0].items.should.be.an.Array()
    })
  })

  describe('listing:private', () => {
    it('should return user shelf', async () => {
      const shelf = await createShelf(null, { listing: 'private' })
      const user = await getUser()
      const res = await authReq('get', `${endpoint}&owners=${user._id}`)
      _.map(res.shelves, _.property('_id')).should.containEql(shelf._id)
    })

    it('should not return private shelves', async () => {
      const shelf = await createShelf(getUserB(), { listing: 'private' })
      const user = await getUserB()
      const res = await authReq('get', `${endpoint}&owners=${user._id}`)
      const resIds = _.keys(res.shelves)
      resIds.should.not.containEql(shelf._id)
    })

    it('should not return friends private shelves', async () => {
      const friendA = await createUser()
      const friendB = await createUser()
      await makeFriends(friendA, friendB)

      const shelf = await createShelf(friendB, { listing: 'private' })
      const { _id: friendBId } = await friendB
      const res = await authReq('get', `${endpoint}&owners=${friendBId}`)
      const resIds = _.keys(res.shelves)
      resIds.should.not.containEql(shelf._id)
    })
  })

  describe('listing:network', () => {
    it('should not return non friends network shelves', async () => {
      const shelf = await createShelf(getUserB(), { listing: 'network' })
      const { _id: userBId } = await getUserB()
      const res = await authReq('get', `${endpoint}&owners=${userBId}`)
      const resIds = _.keys(res.shelves)
      resIds.should.not.containEql(shelf._id)
    })

    it('should return friends network shelves', async () => {
      const friendA = await createUser()
      const friendB = await createUser()
      await makeFriends(friendA, friendB)

      const shelf = await createShelf(friendB, { listing: 'network' })
      const { _id: friendBId } = await friendB
      const res = await customAuthReq(friendA, 'get', `${endpoint}&owners=${friendBId}`)
      const resIds = _.keys(res.shelves)
      resIds.should.containEql(shelf._id)
    })
  })
})
