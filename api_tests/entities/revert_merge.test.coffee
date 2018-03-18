CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, adminReq, undesiredErr } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ createWork, createHuman, addClaim, setLabel } = require '../fixtures/entities'

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
        adminReq 'put', '/api/entities?action=revert-merge', { from: workA.uri }
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workA.uri}"
      .then (res)->
        should(res.redirects[workA.uri]).not.be.ok()
        res.entities[workA.uri].should.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert claims transfer', (done)->
    Promise.all [
      createWork()
      createWork()
      createHuman()
    ]
    .spread (workA, workB, author)->
      addClaim workA.uri, 'wdt:P50', author.uri
      .then ->
        adminReq 'put', '/api/entities?action=merge',
          from: workA.uri
          to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        res.entities[workB.uri].claims['wdt:P50'][0].should.equal author.uri
        adminReq 'put', '/api/entities?action=revert-merge', { from: workA.uri }
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        should(res.entities[workB.uri].claims['wdt:P50']).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert labels transfer', (done)->
    label = randomString 6
    Promise.all [
      createWork { labels: { zh: label } }
      createWork()
    ]
    .spread (workA, workB)->
      adminReq 'put', '/api/entities?action=merge',
        from: workA.uri
        to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        res.entities[workB.uri].labels.zh.should.equal label
        adminReq 'put', '/api/entities?action=revert-merge', { from: workA.uri }
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        should(res.entities[workB.uri].labels.zh).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert claim transfers, even when several patches away', (done)->
    Promise.all [
      createWork()
      createWork()
      createHuman()
      createHuman()
    ]
    .spread (workA, workB, authorA, authorB)->
      addClaim workA.uri, 'wdt:P50', authorA.uri
      .then ->
        adminReq 'put', '/api/entities?action=merge',
          from: workA.uri
          to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      # Make another edit between the merge and the revert-merge
      .tap -> addClaim workB.uri, 'wdt:P50', authorB.uri
      .then (res)->
        res.entities[workB.uri].claims['wdt:P50'][0].should.equal authorA.uri
        adminReq 'put', '/api/entities?action=revert-merge', { from: workA.uri }
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        res.entities[workB.uri].claims['wdt:P50'].length.should.equal 1
        res.entities[workB.uri].claims['wdt:P50'][0].should.equal authorB.uri
        done()
    .catch undesiredErr(done)

    return

  it 'should revert labels transfer', (done)->
    labelA = randomString 6
    labelB = randomString 6
    Promise.all [
      createWork { labels: { zh: labelA } }
      createWork()
    ]
    .spread (workA, workB)->
      adminReq 'put', '/api/entities?action=merge',
        from: workA.uri
        to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      # Make another edit between the merge and the revert-merge
      .tap -> setLabel workB.uri, 'nl', labelB
      .then (res)->
        res.entities[workB.uri].labels.zh.should.equal labelA
        adminReq 'put', '/api/entities?action=revert-merge', { from: workA.uri }
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        should(res.entities[workB.uri].labels.zh).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert redirected claims', (done)->
    Promise.all [
      createHuman()
      createHuman()
      createWork()
    ]
    .spread (humanA, humanB, work)->
      addClaim work.uri, 'wdt:P50', humanA.uri
      .then ->
        adminReq 'put', '/api/entities?action=merge',
          from: humanA.uri
          to: humanB.uri
      .then ->
        adminReq 'put', '/api/entities?action=revert-merge', { from: humanA.uri }
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{work.uri}"
      .then (res)->
        res.entities[work.uri].claims['wdt:P50'][0].should.equal humanA.uri
        done()
    .catch undesiredErr(done)

    return
