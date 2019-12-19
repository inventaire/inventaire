const __ = require('config').universalPath
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createBookshelf, bookshelfName, bookshelfDescription } = require('../fixtures/bookshelves')

const endpoint = '/api/bookshelves?action=update'
const bookshelfPromise = createBookshelf()

describe('bookshelves:update', () => {
  it('should reject without bookshelf id', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without attributes', async () => {
    const bookshelf = await bookshelfPromise
    try {
      const res = await authReq('post', endpoint, {
        id: bookshelf._id,
        foo: 'bar'
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should update attributes', async () => {
    const name = bookshelfName()
    const description = bookshelfDescription()
    const listing = 'network'
    const bookshelf = await bookshelfPromise
    const res = await authReq('post', endpoint, {
      id: bookshelf._id,
      name,
      description,
      listing
    })
    res.name.should.equal(name)
    res.description.should.equal(description)
    res.listing.should.equal(listing)
  })

  it('should reject updating if different owner', async () => {
    try {
      const bookshelf = await bookshelfPromise
      const res = await authReqB('post', endpoint, {
        id: bookshelf._id,
        name: 'foo'
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.startWith('wrong owner')
      err.statusCode.should.equal(400)
    }
  })
})
