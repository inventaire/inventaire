CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ getGroup, endpointBase } = require './helpers'

describe 'groups:get', ->
  describe 'by-id', ->
    it 'should get a group by id', (done)->
      getGroup
      .then (group)->
        nonAuthReq 'get', "#{endpointBase}=by-id&id=#{group._id}"
        .then (res)->
          res.group._id.should.equal group._id
          res.group._rev.should.equal group._rev
          res.group.name.should.equal group.name
          res.group.slug.should.equal group.slug
          done()
      .catch undesiredErr(done)

      return

  describe 'by-slug', ->
    it 'should get a group by slug', (done)->
      getGroup
      .then (group)->
        nonAuthReq 'get', "#{endpointBase}=by-slug&slug=#{group.slug}"
        .then (res)->
          res.group._id.should.equal group._id
          res.group._rev.should.equal group._rev
          res.group.name.should.equal group.name
          res.group.slug.should.equal group.slug
          done()
      .catch undesiredErr(done)

      return
