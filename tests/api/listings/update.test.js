const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, customAuthReq, getReservedUser } = require('tests/api/utils/utils')
const { authReq, authReqB, getUser } = require('../utils/utils')
const { createListing, listingName, listingDescription } = require('../fixtures/listings')
const { createGroupWithAMember, getSomeGroup } = require('tests/api/fixtures/groups')
const { someCouchUuid } = require('tests/api/fixtures/general')

const endpoint = '/api/lists'

describe('listings:update', () => {
  it('should reject without listing id', async () => {
    try {
      await authReq('put', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should filter out non updatable attributes', async () => {
    const { listing } = await createListing()
    try {
      const params = {
        id: listing._id,
        foo: 'bar'
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject an empty name', async () => {
    const { listing } = await createListing()
    try {
      const params = {
        id: listing._id,
        name: ''
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid name:')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject when listing is not found', async () => {
    try {
      const params = {
        id: someCouchUuid,
        name: ''
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('not_found:')
      err.statusCode.should.equal(404)
    }
  })

  it('should update attributes', async () => {
    const name = listingName()
    const description = listingDescription()
    const visibility = [ 'friends' ]
    const { listing } = await createListing()
    const { list: updatedListing } = await authReq('put', endpoint, {
      id: listing._id,
      name,
      description,
      visibility,
    })
    updatedListing.name.should.equal(name)
    updatedListing.description.should.equal(description)
    updatedListing.visibility.should.deepEqual(visibility)
  })

  it('should update a group-specific visibility', async () => {
    const { group, member } = await createGroupWithAMember()
    const { listing } = await createListing(member)
    const visibility = [ `group:${group._id}` ]
    const { list: updatedListing } = await customAuthReq(member, 'put', endpoint, {
      id: listing._id,
      visibility,
    })
    updatedListing.visibility.should.deepEqual(visibility)
  })

  it("should reject the update of a listing with a group-specific visibility from a group the user isn't a member of", async () => {
    const [ user, group ] = await Promise.all([
      getReservedUser(),
      getSomeGroup(),
    ])
    const { listing } = await createListing(user)
    const visibility = [ `group:${group._id}` ]
    await customAuthReq(user, 'put', endpoint, {
      id: listing._id,
      visibility,
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('user is not in that group')
    })
  })

  it('should reject updating if different user', async () => {
    try {
      const { listing } = await createListing()
      const params = {
        id: listing._id,
        name: 'foo'
      }
      await authReqB('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong user')
      err.statusCode.should.equal(403)
    }
  })

  it('should throw when no new attribute to update', async () => {
    try {
      const { listing } = await createListing(getUser())
      const params = {
        id: listing._id,
        name: listing.name
      }
      await authReq('put', endpoint, params).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('nothing to update')
      err.statusCode.should.equal(400)
    }
  })

  it('should be able to remove a listing description', async () => {
    const { listing } = await createListing()
    const { list: updatedListing } = await authReq('put', endpoint, {
      id: listing._id,
      description: null,
    })
    updatedListing.description.should.equal('')
  })
})
