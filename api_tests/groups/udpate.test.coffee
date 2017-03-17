CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq } = __.require 'apiTests', 'utils/utils'
{ getGroup, endpointBase } = require './helpers'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'groups:update-settings', ->
  it 'should update the group slug when updating the name', (done)->
    getGroup
    .then (group)->
      groupId = group._id
      updatedName = group.name + 'updated'
      authReq 'put', "#{endpointBase}=update-settings",
        group: groupId
        attribute: 'name',
        value: updatedName
      # Seem to be required to let the time to CouchDB to update the document oO
      .delay 0
      .then (updateRes)->
        updateRes.ok.should.be.true()
        nonAuthReq 'get', "#{endpointBase}=by-id&id=#{groupId}"
        .then (getRes)->
          { group } = getRes
          group.name.should.equal updatedName
          group.slug.should.equal slugify(updatedName)
          done()

    return
