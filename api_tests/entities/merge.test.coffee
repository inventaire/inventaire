CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, authReq, adminReq, undesiredErr, undesiredRes } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ createWork, createEdition, ensureEditionExists, createItemFromEntityUri, addClaim } = require '../fixtures/entities'

describe 'entities:merge', ->
  it 'should merge two entities with an inv URI', (done)->
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
        done()
    .catch undesiredErr(done)

    return

  it 'should merge entities with inv and isbn URIs', (done)->
    Promise.all [
      createEdition()
      ensureEditionExists 'isbn:9782298063264'
    ]
    .spread (editionA, editionB)->
      createItemFromEntityUri editionA.uri
      .then (item)->
        item.entity.should.equal editionA.uri
        adminReq 'put', '/api/entities?action=merge',
          from: editionA.uri
          to: editionB.uri
        .then ->
          Promise.all [
            nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{editionA.uri}"
            authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
          ]
        .spread (entitiesRes, itemsRes)->
          entitiesRes.redirects[editionA.uri].should.equal editionB.uri
          entitiesRes.entities[editionB.uri].should.be.ok()
          itemsRes.items[0].entity.should.equal editionB.uri
          done()
    .catch undesiredErr(done)

    return

  it 'should reject merge an entity with an ISBN', (done)->
    Promise.all [
      ensureEditionExists 'isbn:9782298063264'
      createEdition()
    ]
    .spread (editionA, editionB)->
      # Use the inv URI to pass the prefix check
      # and test the claim check
      editionAInvUri = 'inv:' + editionA._id
      adminReq 'put', '/api/entities?action=merge',
        from: editionAInvUri
        to: editionB.uri
      .then undesiredRes(done)
      .catch (err)->
        # That's not a very specific error report, but it does the job
        # of blocking a merge from an edition with an ISBN
        err.body.status_verbose.should.equal "'from' entity not found (could it be not it's canonical uri?)"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

  it 'should transfer claims', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      addClaim workA.uri, 'wdt:P50', 'wd:Q535'
      .then ->
        adminReq 'put', '/api/entities?action=merge',
          from: workA.uri
          to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{workB.uri}"
      .then (res)->
        res.entities[workB.uri].claims['wdt:P50'][0].should.equal 'wd:Q535'
        done()
    .catch undesiredErr(done)

    return

  it 'should transfer labels', (done)->
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
        done()
    .catch undesiredErr(done)

    return

  it 'should keep track of the patch context', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      addClaim workA.uri, 'wdt:P50', 'wd:Q535'
      .then ->
        adminReq 'put', '/api/entities?action=merge',
          from: workA.uri
          to: workB.uri
      .then -> nonAuthReq 'get', "/api/entities?action=history&id=#{workB._id}"
      .then (res)->
        res.patches[1].context.mergeFrom.should.equal workA.uri
        done()
    .catch undesiredErr(done)

    return
