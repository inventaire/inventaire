CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, authReq, getUser, adminReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ createWork, createEdition, ensureEditionExists, createItemFromEntityUri } = require './helpers'

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
