const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { publicReq, authReq, shouldNotBeCalled } = require('../utils/utils')
const { wait } = __.require('lib', 'promises')
const { groupPromise, createGroup } = require('../fixtures/groups')
const slugify = __.require('controllers', 'groups/lib/slugify')
const endpoint = '/api/groups?action=update-settings'

describe('groups:update-settings', () => {
  it('should reject without a group', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should update the group slug when updating the name', async () => {
    const group = await groupPromise
    const groupId = group._id
    const updatedName = `${group.name}-updated`
    const updateRes = await authReq('put', endpoint, {
      group: groupId,
      attribute: 'name',
      value: updatedName
    })
    await wait(50)
    updateRes.ok.should.be.true()
    const { group: updatedGroup } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    updatedGroup.name.should.equal(updatedName)
    updatedGroup.slug.should.equal(slugify(updatedName))
  })

  it('should request a group slug update when updating the name', async () => {
    const group = await groupPromise
    const groupId = group._id
    const updatedName = `${group.name}-updated-again`
    const updateRes = await authReq('put', endpoint, {
      group: groupId,
      attribute: 'name',
      value: updatedName
    })
    await wait(50)
    updateRes.ok.should.be.true()
    updateRes.update.slug.should.equal(slugify(updatedName))
  })

  it('should update description', async () => {
    const updatedDescription = 'Lorem ipsum dolor sit amet'
    const group = await groupPromise
    const groupId = group._id
    const updateRes = await authReq('put', endpoint, {
      group: groupId,
      attribute: 'description',
      value: updatedDescription
    })
    await wait(50)
    updateRes.ok.should.be.true()
    Object.keys(updateRes.update).length.should.equal(0)
    const { group: updatedGroup } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    updatedGroup.description.should.equal(updatedDescription)
  })

  it('should update position', async () => {
    const { _id: groupId } = await groupPromise
    await authReq('put', endpoint, {
      group: groupId,
      attribute: 'position',
      value: [ 0.123456789, 0.123456789 ]
    })
    const { group } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    group.position.should.deepEqual([ 0.12346, 0.12346 ])
  })

  it('should update searchable parameter', async () => {
    const { _id: groupId, searchable } = await groupPromise
    searchable.should.be.true()
    await authReq('put', endpoint, {
      group: groupId,
      attribute: 'searchable',
      value: false
    })
    const { group } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    group.searchable.should.be.false()
  })

  it('should update open parameter', async () => {
    const newGroup = await createGroup()
    const { _id: groupId } = newGroup
    await authReq('put', endpoint, {
      group: groupId,
      attribute: 'open',
      value: true
    })
    const { group } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    group.open.should.be.true()
  })
})
