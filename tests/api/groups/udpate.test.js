CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, undesiredErr } = require '../utils/utils'
{ groupPromise, endpointAction } = require '../fixtures/groups'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'groups:update-settings', ->
  it 'should update the group slug when updating the name', (done)->
    groupPromise
    .then (group)->
      groupId = group._id
      updatedName = group.name + '-updated'
      authReq 'put', "#{endpointAction}=update-settings",
        group: groupId
        attribute: 'name',
        value: updatedName
      # Seem to be required to let the time to CouchDB to update the document oO
      .delay 50
      .then (updateRes)->
        updateRes.ok.should.be.true()
        nonAuthReq 'get', "#{endpointAction}=by-id&id=#{groupId}"
        .then (getRes)->
          { group } = getRes
          group.name.should.equal updatedName
          group.slug.should.equal slugify(updatedName)
          done()
    .catch undesiredErr(done)

    return

  it 'should request a group slug update when updating the name', (done)->
    groupPromise
    .then (group)->
      groupId = group._id
      updatedName = group.name + '-updated-again'
      authReq 'put', "#{endpointAction}=update-settings",
        group: groupId
        attribute: 'name',
        value: updatedName
      # Seem to be required to let the time to CouchDB to update the document oO
      .delay 50
      .then (updateRes)->
        updateRes.ok.should.be.true()
        updateRes.update.slug.should.equal slugify(updatedName)
        done()
    .catch undesiredErr(done)

    return

  it 'should update description', (done)->
    updatedDescription = 'Lorem ipsum dolor sit amet'
    groupPromise
    .then (group)->
      groupId = group._id
      authReq 'put', "#{endpointAction}=update-settings",
        group: groupId
        attribute: 'description',
        value: updatedDescription
      # Seem to be required to let the time to CouchDB to update the document oO
      .delay 50
      .then (updateRes)->
        updateRes.ok.should.be.true()
        Object.keys(updateRes.update).length.should.equal 0
        nonAuthReq 'get', "#{endpointAction}=by-id&id=#{groupId}"
        .then (getRes)->
          { group } = getRes
          group.description.should.equal updatedDescription
          done()
    .catch undesiredErr(done)

    return
