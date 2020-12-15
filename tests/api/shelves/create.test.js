const __ = require('config').universalPath
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { authReq, getUser, getUserB } = require('../utils/utils')
const { shelfName } = require('../fixtures/shelves')
const { createGroup } = require('../fixtures/groups')
const endpoint = '/api/shelves?action=create'

describe('shelves:user:create', () => {
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
    const params = {
      name,
      listing: 'public'
    }
    const res = await authReq('post', endpoint, params)
    res.should.be.ok()
  })
})

describe('shelves:group:create', () => {
  it('should reject if user is not group admin', async () => {
    try {
      const userB = await getUserB()
      const group = await createGroup({ user: userB })
      const name = shelfName()
      const params = {
        group: group._id,
        name,
        listing: 'public'
      }
      await authReq('post', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('user is not a group admin')
      err.statusCode.should.equal(403)
    }
  })

  it('should create shelf with a group as owner', async () => {
    const user = await getUser()
    const group = await createGroup({ user })
    const name = shelfName()
    const params = {
      group: group._id,
      name,
      listing: 'public'
    }
    const res = await authReq('post', endpoint, params)
    res.should.be.ok()
    res.shelf.owner.should.equal(group._id)
  })
})
