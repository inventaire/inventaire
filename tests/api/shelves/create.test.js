const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, customAuthReq, getReservedUser } = require('tests/api/utils/utils')
const { authReq } = require('../utils/utils')
const { shelfName } = require('../fixtures/shelves')
const { createItem } = require('../fixtures/items')
const { createGroupWithAMember, getSomeGroup } = require('tests/api/fixtures/groups')
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

  it('should default to private visibility', async () => {
    const { shelf } = await authReq('post', endpoint, { name: shelfName() })
    shelf.visibility.should.deepEqual([])
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

  it('should create a shelf', async () => {
    const name = shelfName()
    const color = '#123412'
    const visibility = [ 'public' ]
    const { shelf } = await authReq('post', endpoint, { name, color, visibility })
    shelf.name.should.equal(name)
    shelf.visibility.should.deepEqual(visibility)
    shelf.color.should.equal(color)
  })

  it('should create shelf with items', async () => {
    const name = shelfName()
    const item = await createItem()
    const { shelf } = await authReq('post', endpoint, { name, visibility: [], items: [ item._id ] })
    const res = await authReq('get', `/api/shelves?action=by-ids&ids=${shelf._id}&with-items=true`)
    const resShelf = res.shelves[shelf._id]
    resShelf.items.should.containEql(item._id)
  })

  it('should create a shelf with friends-only visibility', async () => {
    const visibility = [ 'friends' ]
    const { shelf } = await authReq('post', endpoint, { name: shelfName(), visibility })
    shelf.visibility.should.deepEqual(visibility)
  })

  it('should create a shelf with groups-only visibility', async () => {
    const visibility = [ 'groups' ]
    const { shelf } = await authReq('post', endpoint, { name: shelfName(), visibility })
    shelf.visibility.should.deepEqual(visibility)
  })

  it('should create a shelf with group-specific visibility', async () => {
    const { group, member } = await createGroupWithAMember()
    const visibility = [ `group:${group._id}` ]
    const { shelf } = await customAuthReq(member, 'post', endpoint, { name: shelfName(), visibility })
    shelf.visibility.should.deepEqual(visibility)
  })

  it('should create a shelf with friends-only visibility', async () => {
    const visibility = [ 'friends' ]
    const { shelf } = await authReq('post', endpoint, { name: shelfName(), visibility })
    shelf.visibility.should.deepEqual(visibility)
  })

  it("should reject creation of group-specific shelf if user isn't a member", async () => {
    const [ user, group ] = await Promise.all([
      getReservedUser(),
      getSomeGroup(),
    ])
    const visibility = [ `group:${group._id}` ]
    await customAuthReq(user, 'post', endpoint, { name: shelfName(), visibility })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('user is not in that group')
    })
  })
})
