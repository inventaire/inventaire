const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { publicReq, authReq, undesiredRes } = require('../utils/utils')
const { Wait } = __.require('lib', 'promises')
const { groupPromise } = require('../fixtures/groups')
const slugify = __.require('controllers', 'groups/lib/slugify')
const endpoint = '/api/groups?action=update-settings'

describe('groups:update-settings', () => {
  it('should reject without a group', done => {
    authReq('put', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should update the group slug when updating the name', done => {
    groupPromise
    .then(group => {
      const groupId = group._id
      const updatedName = `${group.name}-updated`
      return authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      })
      .then(Wait(50))
      .then(updateRes => {
        updateRes.ok.should.be.true()
        return publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
        .then(({ group: updatedGroup }) => {
          updatedGroup.name.should.equal(updatedName)
          updatedGroup.slug.should.equal(slugify(updatedName))
          done()
        })
      })
    })
    .catch(done)
  })

  it('should request a group slug update when updating the name', done => {
    groupPromise
    .then(group => {
      const groupId = group._id
      const updatedName = `${group.name}-updated-again`
      return authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      })
      .then(Wait(50))
      .then(updateRes => {
        updateRes.ok.should.be.true()
        updateRes.update.slug.should.equal(slugify(updatedName))
        done()
      })
    })
    .catch(done)
  })

  it('should update description', done => {
    const updatedDescription = 'Lorem ipsum dolor sit amet'
    groupPromise
    .then(group => {
      const groupId = group._id
      return authReq('put', endpoint, {
        group: groupId,
        attribute: 'description',
        value: updatedDescription
      })
      .then(Wait(50))
      .then(updateRes => {
        updateRes.ok.should.be.true()
        Object.keys(updateRes.update).length.should.equal(0)
        return publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
      })
    })
    .then(({ group }) => {
      group.description.should.equal(updatedDescription)
      done()
    })
    .catch(done)
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
})
