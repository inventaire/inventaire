const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq } = require('../utils/utils')
const { shelfName } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')
const endpoint = '/api/shelves?action=create'

describe('shelves:create', () => {
  it('should reject without name', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: name')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without listing', async () => {
    try {
      const name = shelfName()
      const params = { name }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: listing')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject an empty name', async () => {
    try {
      const params = { name: '' }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('invalid name: name cannot be empty')
      err.statusCode.should.equal(400)
    }
  })

  it('should create shelf', async () => {
    const name = shelfName()
    const listing = 'public'
    const color = '#123412'
    const { shelf } = await authReq('post', endpoint, { name, listing, color })
    shelf.name.should.equal(name)
    shelf.listing.should.equal(listing)
    shelf.color.should.equal(color)
  })

  it('should create shelf with items', async () => {
    const name = shelfName()
    const item = await createItem()
    const { shelf } = await authReq('post', endpoint, { name, listing: 'public', items: [ item._id ] })
    const res = await authReq('get', `/api/shelves?action=by-ids&ids=${shelf._id}&with-items=true`)
    const resShelf = res.shelves[shelf._id]
    resShelf.items.should.containEql(item._id)
  })
})
