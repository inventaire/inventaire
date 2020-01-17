const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { customAuthReq, authReq, getUser, getUserB } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')
const { setFriendship } = require('../utils/relations')
const { createUser } = require('../fixtures/users')
const { Promise } = __.require('lib', 'promises')

const endpoint = '/api/shelves?action=by-owners'

describe('shelves:by-owners', () => {
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

  it('should return current user shelves without items by default', async () => {
    const shelf = await createShelf()
    const user = await getUser()
    const res = await authReq('get', `${endpoint}&owners=${user._id}`)
    _.map(res.shelves, _.property('_id')).should.containEql(shelf._id)
  })

  it('should return shelves items when passing with-items params', async () => {
    await createShelf()
    const user = await getUser()
    const res = await authReq('get', `${endpoint}&owners=${user._id}&with-items=true`)
    _.values(res.shelves)[0].items.should.be.an.Array()
  })

  it('should return public shelves', async () => {
    const shelf = await createShelf(getUserB(), { listing: 'private' })
    const user = await getUserB()
    const res = await authReq('get', `${endpoint}&owners=${user._id}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })

  it('should not return non friends network shelves', async () => {
    const shelf = await createShelf(getUserB(), { listing: 'network' })
    await Promise.resolve().delay(300)
    const { _id: userBId } = await getUserB()
    const res = await authReq('get', `${endpoint}&owners=${userBId}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })

  it('should return friends network shelves', async () => {
    const friendAPromise = createUser()
    const friendBPromise = createUser()
    await setFriendship(friendAPromise, friendBPromise)

    const shelf = await createShelf(friendBPromise, { listing: 'network' })
    await Promise.resolve().delay(300)
    const { _id: friendBId } = await friendBPromise
    const res = await customAuthReq(friendAPromise, 'get', `${endpoint}&owners=${friendBId}`)
    const resIds = _.keys(res.shelves)
    resIds.should.containEql(shelf._id)
  })

  it('should not return friends private shelves', async () => {
    const friendAPromise = createUser()
    const friendBPromise = createUser()
    await setFriendship(friendAPromise, friendBPromise)

    const shelf = await createShelf(friendBPromise, { listing: 'private' })
    await Promise.resolve().delay(300)
    const { _id: friendBId } = await friendBPromise
    const res = await authReq('get', `${endpoint}&owners=${friendBId}`)
    const resIds = _.keys(res.shelves)
    resIds.should.not.containEql(shelf._id)
  })
})
