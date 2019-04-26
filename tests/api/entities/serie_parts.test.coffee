CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr } = require '../utils/utils'
{ createWorkWithAuthorAndSerie } = require '../fixtures/entities'
workWithSeriePromise = createWorkWithAuthorAndSerie()

describe 'entities:author-works', ->
  it 'should get an authors works', (done)->
    workWithSeriePromise
    .then (work)->
      serieUri = work.claims['wdt:P179'][0]
      nonAuthReq 'get', "/api/entities?action=serie-parts&uri=#{serieUri}"
      .then (res)->
        res.parts.should.be.an.Array()
        res.parts[0].should.be.an.Object()
        res.parts[0].uri.should.equal "inv:#{work._id}"
        done()
    .catch undesiredErr(done)

    return
