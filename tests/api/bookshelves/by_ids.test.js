const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { createBookshelf } = require('../fixtures/bookshelves')

const endpoint = '/api/bookshelves?action=by-ids'

describe('bookshelves:by-ids', () => {
  it('should reject without id', async () => {
    try {
      const res = await authReq('get', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should get bookshelves without items by default', async () => {
    const bookshelf = await createBookshelf()
    const res = await authReq('get', `${endpoint}&ids=${bookshelf._id}`)
    res.bookshelves.should.be.ok()
  })

  it('should get bookshelves items when passing with-items params', async () => {
    const bookshelf = await createBookshelf()
    const res = await authReq('get', `${endpoint}&ids=${bookshelf._id}&with-items=true`)
    _.values(res.bookshelves)[0].items.should.be.an.Array()
  })
})
