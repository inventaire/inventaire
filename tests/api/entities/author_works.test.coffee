CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr } = require '../utils/utils'
{ createWorkWithAuthor } = require '../fixtures/entities'
workWithAuthorPromise = createWorkWithAuthor()

describe 'entities:author-works', ->
  it 'should get an authors works', (done)->
    workWithAuthorPromise
    .then (work)->
      authorUri = work.claims['wdt:P50'][0]
      nonAuthReq 'get', "/api/entities?action=author-works&uri=#{authorUri}"
      .then (res)->
        res.series.should.be.an.Array()
        res.works.should.be.an.Array()
        res.articles.should.be.an.Array()
        res.works[0].should.be.an.Object()
        res.works[0].uri.should.equal "inv:#{work._id}"
        done()
    .catch undesiredErr(done)

    return
