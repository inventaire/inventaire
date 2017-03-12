CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq } = require '../utils/utils'

describe 'entities:changes', ->
  it 'should returns an array of changes', (done)->
    nonAuthReq 'get', '/api/entities?action=changes'
    .then (res)->
      res.uris.should.be.an.Array()
      res.lastSeq.should.be.an.Number()
      done()

    return

  it 'should take a since parameter', (done)->
    nonAuthReq 'get', '/api/entities?action=changes&since=2'
    .then (res)->
      res.uris.should.be.an.Array()
      res.lastSeq.should.be.an.Number()
      done()

    return

  it 'should throw when passed an invalid since parameter', (done)->
    nonAuthReq 'get', '/api/entities?action=changes&since=-2'
    .catch (err)->
      err.body.error_name.should.equal 'invalid_since'
      done()

    return
