const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, getUser } = require('../utils/utils')
const { createBookshelf } = require('../fixtures/bookshelves')

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

  it('should get bookshelves without items by default', async () => {
    const bookshelf = await createBookshelf()
    const user = await getUser()
    const res = await authReq('get', `${endpoint}&owners=${user._id}`)
    _.map(res.bookshelves, _.property('_id')).should.containEql(bookshelf._id)
  })

  it('should get bookshelves items when passing with-items params', async () => {
    await createBookshelf()
    const user = await getUser()
    const res = await authReq('get', `${endpoint}&owners=${user._id}&with-items=true`)
    _.values(res.bookshelves)[0].items.should.be.an.Array()
  })
})
