const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { customAuthReq, authReq, getUser, getUserB } = require('../utils/utils')
const { createBookshelf } = require('../fixtures/bookshelves')
const { createUser, setFriendship } = require('../fixtures/users')
const { Promise } = __.require('lib', 'promises')

const endpoint = '/api/bookshelves?action=by-owners'

describe('bookshelves:by-owners', () => {
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

  it('should return current user bookshelves without items by default', async () => {
    const bookshelf = await createBookshelf()
    const user = await getUser()
    const res = await authReq('get', `${endpoint}&owners=${user._id}`)
    _.map(res.bookshelves, _.property('_id')).should.containEql(bookshelf._id)
  })

  it('should return bookshelves items when passing with-items params', async () => {
    await createBookshelf()
    const user = await getUser()
    const res = await authReq('get', `${endpoint}&owners=${user._id}&with-items=true`)
    _.values(res.bookshelves)[0].items.should.be.an.Array()
  })

  it('should return public bookshelves', async () => {
    const bookshelf = await createBookshelf(getUserB(), { listing: 'private' })
    const user = await getUserB()
    const res = await authReq('get', `${endpoint}&owners=${user._id}`)
    const resIds = _.keys(res.bookshelves)
    resIds.should.not.containEql(bookshelf._id)
  })

  it('should not return non friends network bookshelves', async () => {
    const bookshelf = await createBookshelf(getUserB(), { listing: 'network' })
    await Promise.resolve().delay(300)
    const { _id: userBId } = await getUserB()
    const res = await authReq('get', `${endpoint}&owners=${userBId}`)
    const resIds = _.keys(res.bookshelves)
    resIds.should.not.containEql(bookshelf._id)
  })

  it('should return friends network bookshelves', async () => {
    const friendAPromise = createUser()
    const friendBPromise = createUser()
    await setFriendship(friendAPromise, friendBPromise)

    const bookshelf = await createBookshelf(friendBPromise, { listing: 'network' })
    await Promise.resolve().delay(300)
    const { _id: friendBId } = await friendBPromise
    const res = await customAuthReq(friendAPromise, 'get', `${endpoint}&owners=${friendBId}`)
    const resIds = _.keys(res.bookshelves)
    resIds.should.containEql(bookshelf._id)
  })

  it('should not return friends private bookshelves', async () => {
    const friendAPromise = createUser()
    const friendBPromise = createUser()
    await setFriendship(friendAPromise, friendBPromise)

    const bookshelf = await createBookshelf(friendBPromise, { listing: 'private' })
    await Promise.resolve().delay(300)
    const { _id: friendBId } = await friendBPromise
    const res = await authReq('get', `${endpoint}&owners=${friendBId}`)
    const resIds = _.keys(res.bookshelves)
    resIds.should.not.containEql(bookshelf._id)
  })
})
