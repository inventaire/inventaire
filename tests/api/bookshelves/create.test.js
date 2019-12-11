const __ = require('config').universalPath
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { bookshelfDescription, bookshelfName } = require('../fixtures/bookshelves')
const endpoint = '/api/bookshelves?action=create'

describe('bookshelves:create', () => {
  it('should reject without id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: description')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without listing', async () => {
    try {
      const description = bookshelfDescription()
      const res = await authReq('post', endpoint, { description })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: listing')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without name', async () => {
    try {
      const description = bookshelfDescription()
      const res = await authReq('post', endpoint, {
        description,
        listing: 'public'
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: name')
      err.statusCode.should.equal(400)
    }
  })

  it('should create bookshelf', async () => {
    const description = bookshelfDescription()
    const name = bookshelfName()
    const res = await authReq('post', endpoint, {
      description,
      listing: 'public',
      name
    })
    res.should.be.ok()
  })
})
