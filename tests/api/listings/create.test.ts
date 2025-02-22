import { createGroupWithAMember, getSomeGroup } from '#fixtures/groups'
import { listingName } from '#fixtures/listings'
import { createUser } from '#fixtures/users'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const endpoint = '/api/lists?action=create'

describe('listings:create', () => {
  it('should reject without name', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: name')
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

  describe('visibility', () => {
    it('should default to private visibility', async () => {
      const name = listingName()
      const { list: listing } = await authReq('post', endpoint, { name })
      listing.visibility.should.deepEqual([])
      listing.name.should.equal(name)
    })

    it('should create a listing with friends-only visibility', async () => {
      const visibility = [ 'friends' ]
      const { list: listing } = await authReq('post', endpoint, { name: listingName(), visibility })
      listing.visibility.should.deepEqual(visibility)
    })

    it('should create a listing with groups-only visibility', async () => {
      const visibility = [ 'groups' ]
      const { list: listing } = await authReq('post', endpoint, { name: listingName(), visibility })
      listing.visibility.should.deepEqual(visibility)
    })

    it('should create a listing with group-specific visibility', async () => {
      const { group, member } = await createGroupWithAMember()
      const visibility = [ `group:${group._id}` ]
      const { list: listing } = await customAuthReq(member, 'post', endpoint, { name: listingName(), visibility })
      listing.visibility.should.deepEqual(visibility)
    })

    it("should reject group-specific listing if user isn't a member", async () => {
      const [ user, group ] = await Promise.all([
        createUser(),
        getSomeGroup(),
      ])
      const visibility = [ `group:${group._id}` ]
      await customAuthReq(user, 'post', endpoint, { name: listingName(), visibility })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('user is not in that group')
      })
    })
  })

  describe('entities type', () => {
    it('should default to work type', async () => {
      const { list: listing } = await authReq('post', endpoint, { name: listingName() })
      listing.type.should.equal('work')
    })

    it('should create listing with author type', async () => {
      const { list: listing } = await authReq('post', endpoint, {
        name: listingName(),
        type: 'author',
      })
      listing.type.should.equal('author')
    })
  })
})
