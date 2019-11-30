const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { nonAuthReq, authReq, undesiredErr } = require('../utils/utils')
const { groupPromise } = require('../fixtures/groups')
const slugify = __.require('controllers', 'groups/lib/slugify')
const endpoint = '/api/groups?action=update-settings'

describe('groups:update-settings', () => {
  it('should update the group slug when updating the name', done => {
    groupPromise
    .then(group => {
      const groupId = group._id
      const updatedName = `${group.name}-updated`
      authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      })
      .delay(50)
      .then(updateRes => {
        updateRes.ok.should.be.true()
        nonAuthReq('get', `/api/groups?action=by-id&id=${groupId}`)
        .then(getRes => {
          ({ group } = getRes)
          group.name.should.equal(updatedName)
          group.slug.should.equal(slugify(updatedName))
          done()
        })
      })
    })
    .catch(undesiredErr(done))
  })

  it('should request a group slug update when updating the name', done => {
    groupPromise
    .then(group => {
      const groupId = group._id
      const updatedName = `${group.name}-updated-again`
      authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      })
      .delay(50)
      .then(updateRes => {
        updateRes.ok.should.be.true()
        updateRes.update.slug.should.equal(slugify(updatedName))
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should update description', done => {
    const updatedDescription = 'Lorem ipsum dolor sit amet'
    groupPromise
    .then(group => {
      const groupId = group._id
      authReq('put', endpoint, {
        group: groupId,
        attribute: 'description',
        value: updatedDescription
      })
      .delay(50)
      .then(updateRes => {
        updateRes.ok.should.be.true()
        Object.keys(updateRes.update).length.should.equal(0)
        nonAuthReq('get', `/api/groups?action=by-id&id=${groupId}`)
        .then(getRes => {
          ({ group } = getRes)
          group.description.should.equal(updatedDescription)
          done()
        })
      })
    })
    .catch(undesiredErr(done))
  })
})
