const __ = require('config').universalPath
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { shelfDescription, shelfName } = require('../fixtures/shelves')
const endpoint = '/api/shelves?action=create'

describe('shelves:create', () => {
  it('should reject without listing', async () => {
    try {
      const description = shelfDescription()
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
      const description = shelfDescription()
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

  it('should create shelf', async () => {
    const description = shelfDescription()
    const name = shelfName()
    const res = await authReq('post', endpoint, {
      description,
      listing: 'public',
      name
    })
    res.should.be.ok()
  })
})
