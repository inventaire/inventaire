CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, nonAuthReq, undesiredErr } = require '../utils/utils'
{ groupPromise, endpointAction } = require '../fixtures/groups'

describe 'groups:get', ->
  describe 'default', ->
    it 'should get all user groups', (done)->
      groupPromise
      .then (group)->
        authReq 'get', endpointAction
        .then (res)->
          res.groups.should.be.an.Array()
          groupsIds = _.pluck res.groups, '_id'
          should(group._id in groupsIds).be.true()
          done()
      .catch undesiredErr(done)

      return

  describe 'by-id', ->
    it 'should get a group by id', (done)->
      groupPromise
      .then (group)->
        nonAuthReq 'get', "#{endpointAction}=by-id&id=#{group._id}"
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
      groupPromise
      .then (group)->
        nonAuthReq 'get', "#{endpointAction}=by-slug&slug=#{group.slug}"
        .then (res)->
          res.group._id.should.equal group._id
          res.group._rev.should.equal group._rev
          res.group.name.should.equal group.name
          res.group.slug.should.equal group.slug
          done()
      .catch undesiredErr(done)

      return
