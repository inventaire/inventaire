CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, adminReq, undesiredErr } = require '../utils/utils'
{ createWork } = require '../fixtures/entities'

describe 'entities:revert-merge', ->
  it 'should revert merge two entities with an inv URI', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      adminReq 'put', '/api/entities?action=merge',
        from: workA.uri
        to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workA.uri}"
      .then (res)->
        res.redirects[workA.uri].should.equal workB.uri
        res.entities[workB.uri].should.be.ok()
        adminReq 'put', '/api/entities?action=revert-merge',
          from: workA.uri
          to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workA.uri}"
      .then (res)->
        should(res.redirects[workA.uri]).not.be.ok()
        res.entities[workA.uri].should.be.ok()
        done()
    .catch undesiredErr(done)

    return
