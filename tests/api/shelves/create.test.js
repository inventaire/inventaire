const __ = require('config').universalPath
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { shelfDescription, shelfName } = require('../fixtures/shelves')
const endpoint = '/api/shelves?action=create'

describe('shelves:create', () => {
  it('should reject without name', async () => {
    try {
      const res = await authReq('post', endpoint)
      shouldNotBeCalled(res)
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
      const res = await authReq('post', endpoint, params)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: listing')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject an empty name', async () => {
    try {
      const params = { name: '' }
      const res = await authReq('post', endpoint, params)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('invalid name: name cannot be empty')
      err.statusCode.should.equal(400)
    }
  })

  it('should create shelf', async () => {
    const description = shelfDescription()
    const name = shelfName()
    const params = {
      name,
      description,
      listing: 'public'
    }
    const res = await authReq('post', endpoint, params)
    res.should.be.ok()
  })
})
